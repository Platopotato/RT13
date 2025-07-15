#!/bin/bash
# ======================================================================
# Radix Tribes Deployment Script
# ======================================================================
# This script automates the deployment of Radix Tribes to various platforms.
# It handles Docker image building, pushing to registries, and deployment
# to Railway, Render, or a VPS.
# ======================================================================

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ======================================================================
# Utility Functions
# ======================================================================

print_header() {
  echo -e "\n${PURPLE}===============================================${NC}"
  echo -e "${PURPLE}${1}${NC}"
  echo -e "${PURPLE}===============================================${NC}\n"
}

print_step() {
  echo -e "${BLUE}[STEP]${NC} ${1}"
}

print_info() {
  echo -e "${CYAN}[INFO]${NC} ${1}"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} ${1}"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} ${1}"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} ${1}"
}

confirm() {
  read -p "$1 (y/n): " choice
  case "$choice" in 
    y|Y ) return 0;;
    * ) return 1;;
  esac
}

check_command() {
  if ! command -v $1 &> /dev/null; then
    print_error "$1 is not installed or not in PATH."
    echo -e "Please install $1 using: $2"
    return 1
  else
    print_info "$1 is installed ($(command -v $1))"
    return 0
  fi
}

# ======================================================================
# Prerequisite Checks
# ======================================================================

check_prerequisites() {
  print_header "Checking Prerequisites"
  
  local prereqs_ok=true
  
  # Check for Docker
  if ! check_command "docker" "Visit https://docs.docker.com/get-docker/"; then
    prereqs_ok=false
  fi
  
  # Check for Git
  if ! check_command "git" "apt-get install git or brew install git"; then
    prereqs_ok=false
  fi
  
  # Check for Node.js
  if ! check_command "node" "Visit https://nodejs.org/"; then
    prereqs_ok=false
  fi
  
  # Check for npm
  if ! check_command "npm" "Reinstall Node.js from https://nodejs.org/"; then
    prereqs_ok=false
  fi
  
  # Check for platform-specific tools based on deployment choice
  case "$DEPLOY_TARGET" in
    railway)
      if ! check_command "railway" "npm install -g @railway/cli"; then
        prereqs_ok=false
      fi
      ;;
    render)
      print_info "No specific CLI tool required for Render deployment."
      ;;
    vps)
      if ! check_command "ssh" "apt-get install openssh-client or brew install openssh"; then
        prereqs_ok=false
      fi
      ;;
  esac
  
  # Check for project files
  if [ ! -f "server.js" ] || [ ! -f "package.json" ]; then
    print_error "server.js or package.json not found. Are you in the project root directory?"
    prereqs_ok=false
  fi
  
  # Check for Docker configuration
  if [ ! -f "Dockerfile" ] || [ ! -f "docker-compose.yml" ]; then
    print_error "Dockerfile or docker-compose.yml not found."
    prereqs_ok=false
  fi
  
  if [ "$prereqs_ok" = false ]; then
    print_error "Please fix the above issues and run this script again."
    exit 1
  else
    print_success "All prerequisites are met!"
  fi
}

# ======================================================================
# Docker Image Building
# ======================================================================

build_docker_image() {
  print_header "Building Docker Image"
  
  # Ask for image name and tag
  read -p "Enter image name (default: radix-tribes): " IMAGE_NAME
  IMAGE_NAME=${IMAGE_NAME:-radix-tribes}
  
  read -p "Enter image tag (default: latest): " IMAGE_TAG
  IMAGE_TAG=${IMAGE_TAG:-latest}
  
  FULL_IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"
  
  print_step "Building Docker image as $FULL_IMAGE_NAME"
  
  if docker build -t $FULL_IMAGE_NAME .; then
    print_success "Docker image built successfully!"
    
    # Offer to run the image locally for testing
    if confirm "Would you like to test the image locally?"; then
      print_step "Running container for testing..."
      
      # Create data directory if it doesn't exist
      mkdir -p ./data
      
      # Run container with mounted data volume
      docker run -d --name radix-tribes-test -p 3000:3000 \
        -v "$(pwd)/data:/data" \
        -e "NODE_ENV=development" \
        -e "PORT=3000" \
        -e "DATA_DIR=/data" \
        -e "DATABASE_FILE=/data/game-data.json" \
        -e "ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173" \
        $FULL_IMAGE_NAME
      
      print_info "Container started! Visit http://localhost:3000 to test."
      print_info "Press Ctrl+C when you're done testing."
      
      # Wait for user to finish testing
      read -p "Press Enter to stop the test container..."
      
      # Stop and remove the test container
      docker stop radix-tribes-test
      docker rm radix-tribes-test
      
      print_success "Test container removed."
    fi
    
    return 0
  else
    print_error "Docker image build failed!"
    return 1
  fi
}

# ======================================================================
# Registry Push Functions
# ======================================================================

push_to_registry() {
  print_header "Pushing to Container Registry"
  
  # Ask which registry to use
  echo "Select container registry:"
  echo "1) Docker Hub"
  echo "2) GitHub Container Registry"
  echo "3) Custom Registry"
  echo "4) Skip registry push"
  
  read -p "Enter choice (1-4): " REGISTRY_CHOICE
  
  case $REGISTRY_CHOICE in
    1)
      push_to_dockerhub
      ;;
    2)
      push_to_ghcr
      ;;
    3)
      push_to_custom_registry
      ;;
    4)
      print_info "Skipping registry push."
      return 0
      ;;
    *)
      print_error "Invalid choice. Skipping registry push."
      return 1
      ;;
  esac
}

push_to_dockerhub() {
  print_step "Pushing to Docker Hub"
  
  # Ask for Docker Hub username
  read -p "Enter Docker Hub username: " DOCKERHUB_USERNAME
  
  if [ -z "$DOCKERHUB_USERNAME" ]; then
    print_error "Docker Hub username cannot be empty."
    return 1
  fi
  
  # Tag the image for Docker Hub
  DOCKERHUB_IMAGE="$DOCKERHUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
  docker tag $FULL_IMAGE_NAME $DOCKERHUB_IMAGE
  
  # Login to Docker Hub
  print_step "Logging in to Docker Hub..."
  docker login
  
  # Push the image
  print_step "Pushing image to Docker Hub..."
  if docker push $DOCKERHUB_IMAGE; then
    print_success "Image pushed to Docker Hub as $DOCKERHUB_IMAGE"
    REGISTRY_IMAGE=$DOCKERHUB_IMAGE
    return 0
  else
    print_error "Failed to push image to Docker Hub."
    return 1
  fi
}

push_to_ghcr() {
  print_step "Pushing to GitHub Container Registry"
  
  # Ask for GitHub username
  read -p "Enter GitHub username: " GITHUB_USERNAME
  
  if [ -z "$GITHUB_USERNAME" ]; then
    print_error "GitHub username cannot be empty."
    return 1
  fi
  
  # Ask for GitHub repository name
  read -p "Enter GitHub repository name: " GITHUB_REPO
  
  if [ -z "$GITHUB_REPO" ]; then
    print_error "GitHub repository name cannot be empty."
    return 1
  fi
  
  # Tag the image for GHCR
  GHCR_IMAGE="ghcr.io/$GITHUB_USERNAME/$GITHUB_REPO/$IMAGE_NAME:$IMAGE_TAG"
  docker tag $FULL_IMAGE_NAME $GHCR_IMAGE
  
  # Login to GHCR
  print_step "Logging in to GitHub Container Registry..."
  print_info "You'll need a GitHub Personal Access Token with 'write:packages' scope."
  print_info "Create one at: https://github.com/settings/tokens"
  
  read -p "Enter GitHub Personal Access Token: " GITHUB_TOKEN
  echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
  
  # Push the image
  print_step "Pushing image to GitHub Container Registry..."
  if docker push $GHCR_IMAGE; then
    print_success "Image pushed to GitHub Container Registry as $GHCR_IMAGE"
    REGISTRY_IMAGE=$GHCR_IMAGE
    return 0
  else
    print_error "Failed to push image to GitHub Container Registry."
    return 1
  fi
}

push_to_custom_registry() {
  print_step "Pushing to Custom Registry"
  
  # Ask for custom registry URL
  read -p "Enter custom registry URL (e.g., registry.example.com): " CUSTOM_REGISTRY
  
  if [ -z "$CUSTOM_REGISTRY" ]; then
    print_error "Custom registry URL cannot be empty."
    return 1
  fi
  
  # Ask for registry username
  read -p "Enter registry username: " REGISTRY_USERNAME
  
  # Tag the image for custom registry
  CUSTOM_IMAGE="$CUSTOM_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
  docker tag $FULL_IMAGE_NAME $CUSTOM_IMAGE
  
  # Login to custom registry
  print_step "Logging in to custom registry..."
  docker login $CUSTOM_REGISTRY -u $REGISTRY_USERNAME
  
  # Push the image
  print_step "Pushing image to custom registry..."
  if docker push $CUSTOM_IMAGE; then
    print_success "Image pushed to custom registry as $CUSTOM_IMAGE"
    REGISTRY_IMAGE=$CUSTOM_IMAGE
    return 0
  else
    print_error "Failed to push image to custom registry."
    return 1
  fi
}

# ======================================================================
# Deployment Functions
# ======================================================================

deploy_application() {
  print_header "Deploying Application"
  
  case "$DEPLOY_TARGET" in
    railway)
      deploy_to_railway
      ;;
    render)
      deploy_to_render
      ;;
    vps)
      deploy_to_vps
      ;;
    *)
      print_error "Invalid deployment target: $DEPLOY_TARGET"
      return 1
      ;;
  esac
}

deploy_to_railway() {
  print_step "Deploying to Railway"
  
  # Check if logged in to Railway
  if ! railway whoami &> /dev/null; then
    print_step "Logging in to Railway..."
    railway login
  fi
  
  # Check if project is linked
  if ! railway status &> /dev/null; then
    print_step "Linking to Railway project..."
    railway link
  fi
  
  # Set environment variables
  print_step "Setting environment variables..."
  railway vars set NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/mnt/data \
    DATABASE_FILE=/mnt/data/game-data.json \
    ALLOWED_ORIGINS="https://your-domain.com"
  
  # Deploy
  print_step "Deploying to Railway..."
  if railway up; then
    print_success "Application deployed to Railway!"
    print_info "Visit https://railway.app/dashboard to view your deployment."
    print_info "Important: Make sure to add a volume for data persistence in the Railway dashboard."
    return 0
  else
    print_error "Deployment to Railway failed."
    return 1
  fi
}

deploy_to_render() {
  print_step "Deploying to Render"
  
  print_info "Render deployment requires the following steps:"
  print_info "1. Push your code to a Git repository (GitHub, GitLab, etc.)"
  print_info "2. Create a new Web Service on Render and connect to your repository"
  print_info "3. Configure the service with the following settings:"
  echo
  echo "   - Environment: Node"
  echo "   - Build Command: npm install"
  echo "   - Start Command: npm start"
  echo "   - Environment Variables:"
  echo "     NODE_ENV=production"
  echo "     PORT=\$PORT (Render sets this automatically)"
  echo "     DATA_DIR=/var/data"
  echo "     DATABASE_FILE=/var/data/game-data.json"
  echo "     ALLOWED_ORIGINS=https://your-domain.com"
  echo
  print_info "4. Add a Persistent Disk with mount path: /var/data"
  
  if confirm "Would you like to open the Render dashboard to create a new service?"; then
    # Try to open the Render dashboard
    if command -v xdg-open &> /dev/null; then
      xdg-open "https://dashboard.render.com/web/new" &
    elif command -v open &> /dev/null; then
      open "https://dashboard.render.com/web/new" &
    else
      print_info "Please visit https://dashboard.render.com/web/new to create a new service."
    fi
  fi
  
  print_info "Follow the instructions in the DEPLOYMENT.md file for detailed Render setup."
  return 0
}

deploy_to_vps() {
  print_step "Deploying to VPS"
  
  # Ask for VPS details
  read -p "Enter VPS hostname or IP address: " VPS_HOST
  
  if [ -z "$VPS_HOST" ]; then
    print_error "VPS hostname cannot be empty."
    return 1
  fi
  
  read -p "Enter SSH username (default: root): " VPS_USER
  VPS_USER=${VPS_USER:-root}
  
  read -p "Enter SSH port (default: 22): " VPS_PORT
  VPS_PORT=${VPS_PORT:-22}
  
  read -p "Enter deployment directory (default: /opt/radix-tribes): " DEPLOY_DIR
  DEPLOY_DIR=${DEPLOY_DIR:-/opt/radix-tribes}
  
  # Generate docker-compose file with environment variables
  print_step "Generating deployment docker-compose.yml..."
  
  cat > deploy-compose.yml << EOF
version: '3.8'

services:
  radix-tribes:
    image: ${REGISTRY_IMAGE:-$FULL_IMAGE_NAME}
    container_name: radix-tribes
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - radix-data:/data
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATA_DIR=/data
      - DATABASE_FILE=/data/game-data.json
      - ALLOWED_ORIGINS=https://your-domain.com
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 5s

volumes:
  radix-data:
    driver: local
EOF
  
  # Copy docker-compose file to VPS
  print_step "Copying docker-compose file to VPS..."
  
  ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "mkdir -p $DEPLOY_DIR"
  scp -P $VPS_PORT deploy-compose.yml $VPS_USER@$VPS_HOST:$DEPLOY_DIR/docker-compose.yml
  
  # Deploy on VPS
  print_step "Deploying on VPS..."
  
  ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << EOF
    cd $DEPLOY_DIR
    
    # Pull the image if using a registry
    if [[ "$REGISTRY_IMAGE" != "" ]]; then
      docker pull $REGISTRY_IMAGE
    fi
    
    # Start the container
    docker-compose up -d
    
    # Check if it's running
    if docker ps | grep radix-tribes; then
      echo "Deployment successful!"
    else
      echo "Deployment failed! Check docker logs."
    fi
EOF
  
  # Clean up local file
  rm deploy-compose.yml
  
  print_success "Application deployed to VPS at $VPS_HOST!"
  print_info "The application should be running at http://$VPS_HOST:3000"
  print_info "You may want to set up a reverse proxy (Nginx, Caddy) and SSL certificates."
  
  return 0
}

# ======================================================================
# Main Script
# ======================================================================

print_header "Radix Tribes Deployment Script"

# Ask for deployment target
echo "Select deployment target:"
echo "1) Railway"
echo "2) Render"
echo "3) VPS (via SSH)"

read -p "Enter choice (1-3): " DEPLOY_CHOICE

case $DEPLOY_CHOICE in
  1)
    DEPLOY_TARGET="railway"
    ;;
  2)
    DEPLOY_TARGET="render"
    ;;
  3)
    DEPLOY_TARGET="vps"
    ;;
  *)
    print_error "Invalid choice. Exiting."
    exit 1
    ;;
esac

print_info "Deploying to $DEPLOY_TARGET"

# Run deployment steps
check_prerequisites

if build_docker_image; then
  # Only push to registry if deploying to VPS or if user wants to
  if [ "$DEPLOY_TARGET" = "vps" ] || confirm "Would you like to push the image to a container registry?"; then
    push_to_registry
  fi
  
  if deploy_application; then
    print_header "Deployment Complete!"
    print_success "Radix Tribes has been successfully deployed to $DEPLOY_TARGET."
    print_info "Check the DEPLOYMENT.md file for post-deployment steps and troubleshooting."
  else
    print_error "Deployment failed. Please check the error messages above."
    exit 1
  fi
else
  print_error "Docker image build failed. Cannot proceed with deployment."
  exit 1
fi

exit 0
