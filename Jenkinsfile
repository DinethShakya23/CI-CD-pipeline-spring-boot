// ============================================================================
// CI/CD Pipeline for Spring Boot Application by Dineth Shakya
// Stages: Build → Test → Code Analysis → Docker Build/Push → GitOps Update
// ============================================================================

pipeline {
  // Agent configuration: Run pipeline in Docker container with Maven, Java, Docker
  agent {
    docker {
      // Custom image with Maven, Java, Docker CLI, and Git pre-installed
      image 'dinethshakya/maven-docker-agent:java17-v1'
      // Mount Docker socket to enable Docker commands inside container (Docker-in-Docker)
      args '--user root -v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  // Global environment variables used throughout pipeline
  environment {
    // Docker Hub registry URL for pushing container images
    DOCKER_REGISTRY = 'https://index.docker.io/v1/'
    // SonarQube server URL for code quality analysis
    SONAR_URL = 'http://13.235.41.162:9000'
    // GitHub credentials for automatic deployment file updates
    GIT_USER_NAME = 'DinethShakya23'
    GIT_USER_EMAIL = 'dinethshakya19@gmail.com'
    // Repository where deployment configuration is stored
    GIT_REPO_NAME = 'CI-CD-pipeline-spring-boot'
    // Docker image tag includes build number for automatic versioning
    DOCKER_IMAGE = "dinethshakya/spring-boot-app:${BUILD_NUMBER}"
  }

  stages {
    // ========== STAGE 1: CHECKOUT ==========
    // Retrieves source code from version control
    stage('Checkout') {
      steps {
        echo 'Checking out source code...'
        checkout scm
      }
    }

    // ========== STAGE 2: BUILD & TEST ==========
    // Compiles Spring Boot application and executes unit tests
    // Generates JAR file in target/ directory
    stage('Build and Test') {
      steps {
        echo 'Building and testing application...'
        // mvn clean: removes old builds
        // mvn package: compiles code and creates deployable JAR
        sh 'mvn clean package'
      }
    }

    // ========== STAGE 3: CODE QUALITY ANALYSIS ==========
    // Analyzes code using SonarQube for bugs, security, code smells, coverage
    // Requires Jenkins credential 'sonarqube' containing SonarQube auth token
    stage('Static Code Analysis') {
      steps {
        echo 'Running SonarQube analysis...'
        // Retrieve SonarQube auth token from Jenkins credentials vault
        withCredentials([string(credentialsId: 'Token_For_SonarQube', variable: 'SONAR_AUTH_TOKEN')]) {
          // Execute Maven sonar plugin and submit results to SonarQube server
          sh 'mvn sonar:sonar -Dsonar.login=$SONAR_AUTH_TOKEN -Dsonar.host.url=${SONAR_URL}'
        }
      }
    }

    // ========== STAGE 4: DOCKER BUILD & PUSH ==========
    // Containerizes the Spring Boot application
    // Pushes Docker image to Docker Hub registry for deployment
    // Image versioned automatically using Jenkins BUILD_NUMBER
    stage('Build and Push Docker Image') {
      steps {
        echo "Building Docker image: ${DOCKER_IMAGE}"
        script {
          // Build Docker image from Dockerfile in project root directory
          sh 'docker build -t ${DOCKER_IMAGE} .'
          // Reference the newly built image
          def dockerImage = docker.image("${DOCKER_IMAGE}")
          // Authenticate with Docker Hub and push image
          // Requires Jenkins credential 'docker-cred' with Docker Hub credentials
          docker.withRegistry("${DOCKER_REGISTRY}", 'docker-cred') {
            dockerImage.push()
          }
          echo "Docker image pushed successfully"
        }
      }
    }

    // ========== STAGE 5: UPDATE DEPLOYMENT (GitOps) ==========
    // Automatically updates deployment configuration with new Docker image version
    // Updates deployment.yml in GitHub repository
    // This triggers the CD pipeline (ArgoCD) to deploy new version
    stage('Update Deployment File') {
      steps {
        echo 'Updating deployment configuration...'
        // Retrieve GitHub access token from Jenkins credentials vault
        withCredentials([string(credentialsId: 'github', variable: 'GITHUB_TOKEN')]) {
          sh '''
            # Construct GitHub repository URL with authentication
            GIT_REPO_URL="https://${GITHUB_TOKEN}@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git"

            # Clone repository if first time, otherwise update existing local copy
            if [ -d "${GIT_REPO_NAME}" ]; then
              cd ${GIT_REPO_NAME}
              # Fetch latest changes from remote repository
              git pull origin main
            else
              # Clone the entire repository from GitHub
              git clone ${GIT_REPO_URL}
              cd ${GIT_REPO_NAME}
            fi

            # Configure Git with user information for commits
            git config user.email "${GIT_USER_EMAIL}"
            git config user.name "${GIT_USER_NAME}"

            # Ensure we're on the main branch
            git checkout main
            
            # Replace old Docker image tag with new BUILD_NUMBER in deployment.yml
            # Pattern: finds "dinethshakya/spring-boot-app:<old_version>" and updates version
            sed -i "s|dinethshakya/spring-boot-app:[0-9]*|dinethshakya/spring-boot-app:${BUILD_NUMBER}|g" deployment.yml
            
            # Stage the modified file for commit
            git add deployment.yml
            
            # Create commit with descriptive message
            git commit -m "Update deployment image to version ${BUILD_NUMBER}"
            
            # Push changes back to GitHub main branch
            git push ${GIT_REPO_URL} HEAD:main
          '''
        }
      }
    }
  }

  // Post-build actions
  post {
    always {
      echo 'Pipeline execution completed'
    }
    success {
      echo 'Pipeline succeeded! Docker image built and deployment updated.'
    }
    failure {
      echo 'Pipeline failed! Check logs for errors.'
    }
  }
}

// ============================================================================
// PIPELINE REQUIREMENTS & SETUP
// ============================================================================
// Jenkins Credentials needed (in Jenkins → Manage Credentials):
// 1. 'sonarqube' - Secret text with SonarQube authentication token
// 2. 'docker-cred' - Username/Password with Docker Hub credentials
// 3. 'github' - Secret text with GitHub Personal Access Token (PAT)
//
// Required Files:
// • Dockerfile: Must exist in project root to build container image
// • deployment.yml: Must exist in CI-CD-pipeline-spring-boot repo on GitHub
//
// Required Services:
// • SonarQube Server: Must be accessible at http://13.235.41.162:8080
// • Docker Hub: Must be accessible for pushing images
// • GitHub: Requires git to be available and token to have repo write access
//
// Image Format: dinethshakya/spring-boot-app:1, :2, :3, etc.
// ============================================================================