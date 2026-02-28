# Complete CI/CD Pipeline for Spring Boot Application

A comprehensive CI/CD implementation demonstrating automated build, test, code quality analysis, containerization, and GitOps-based deployment of a Spring Boot web application.

## 📋 Table of Contents

- [Overview](#overview) <!-- - [Architecture](#architecture) -->
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [CI/CD Pipeline Stages](#cicd-pipeline-stages)
- [Jenkins Setup](#jenkins-setup)
- [Docker Configuration](#docker-configuration)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Installation and Setup](#installation-and-setup) <!-- - [GitOps Workflow](#gitops-workflow) -->
- [Application Details](#application-details)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
<!-- - [Future Enhancements](#future-enhancements) -->

## Overview

This project demonstrates a complete CI/CD pipeline for a Spring Boot web application using industry-standard DevOps tools and practices. The pipeline automatically builds, tests, analyzes code quality, containerizes the application, and deploys it to a Kubernetes cluster using GitOps principles.

### Key Features

- ✅ **Automated Testing** - Unit tests run on every commit
- 🔍 **Code Quality Analysis** - SonarQube integration for code quality metrics
- 🐳 **Containerization** - Automated Docker image creation and registry push
- ☸️ **Kubernetes Deployment** - Container orchestration with 2 replicas
- 🔄 **GitOps** - Automated deployment updates via ArgoCD
- 🏷️ **Version Tracking** - Automatic image versioning using build numbers
- 🛡️ **Security** - Credential management via Jenkins vault

<!-- For detailed architecture diagrams and workflows, see [ARCHITECTURE.md](./ARCHITECTURE.md). -->

## Technology Stack

### Application Layer

- **Framework**: Spring Boot 2.2.4 RELEASE
- **Language**: Java 11
- **Template Engine**: Thymeleaf
- **Build Tool**: Maven 3.x

### CI/CD Tools

- **CI/CD Platform**: Jenkins
- **Custom Agent**: `dinethshakya/maven-docker-agent:java17-v1`
- **Code Quality**: SonarQube
- **Version Control**: Git/GitHub

### Containerization & Orchestration

- **Container Runtime**: Docker
- **Base Image**: adoptopenjdk/openjdk11:alpine-jre
- **Orchestration**: Kubernetes
- **GitOps Tool**: ArgoCD
- **Registry**: Docker Hub

## Prerequisites

Before setting up this project, ensure you have:

### Required Software

- ☕ **Java 11** or higher
- 📦 **Maven 3.x**
- 🐳 **Docker** (for local containerization)
- ☸️ **Kubernetes cluster** (Minikube, EKS, AKS, GKE, etc.)
- 🔧 **Jenkins server** (with Docker support)
- 📊 **SonarQube server** (for code analysis)

### Required Accounts

- 🐙 **GitHub account** with Personal Access Token (repo write permissions)
- 🐳 **Docker Hub account** for image registry
- ☁️ **Cloud provider account** (if using managed Kubernetes)

### Network Access

- Jenkins server must reach SonarQube server
- Jenkins server must reach Docker Hub
- Jenkins server must reach GitHub
- Kubernetes cluster must pull from Docker Hub

## Project Structure

```
CI-CD-pipeline-spring-boot/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── StartApplication.java    # Main Spring Boot application
│       └── resources/
│           └── templates/                    # Thymeleaf templates
├── maven-docker-agent/
│   └── dockerfile                            # Custom Jenkins agent image
├── Jenkinsfile                               # CI/CD pipeline configuration (171 lines)
├── Dockerfile                                # Application container definition
├── deployment.yml                            # Kubernetes deployment manifest
├── pom.xml                                   # Maven project configuration
└── README.md                                 # This file
```

## CI/CD Pipeline Stages

The Jenkins pipeline consists of 5 automated stages:

### 1️⃣ Checkout

**Purpose**: Retrieve the latest source code from GitHub

```groovy
stage('Checkout') {
  steps {
    checkout scm
  }
}
```

- Clones the repository from GitHub
- Uses credentials configured in Jenkins
- Triggers automatically on code push or PR merge

### 2️⃣ Build and Test

**Purpose**: Compile application and run unit tests

```bash
mvn clean package
```

**Actions**:

- Removes previous build artifacts (`mvn clean`)
- Compiles Java source code
- Executes JUnit tests
- Creates executable JAR: `target/spring-boot-web.jar`

**Success Criteria**: All tests pass, JAR created successfully

### 3️⃣ Static Code Analysis

**Purpose**: Analyze code quality, security vulnerabilities, and code coverage

```bash
mvn sonar:sonar \
  -Dsonar.login=$SONAR_AUTH_TOKEN \
  -Dsonar.host.url=${SONAR_URL}
```

**Metrics Analyzed**:

- 🐛 Bugs and code smells
- 🔒 Security vulnerabilities
- 📊 Code coverage
- 📏 Code complexity
- 🔄 Code duplication

**Required Credential**: `Token_For_SonarQube` (Jenkins secret text)

### 4️⃣ Build and Push Docker Image

**Purpose**: Containerize the application and push to Docker Hub

```bash
docker build -t dinethshakya/spring-boot-app:${BUILD_NUMBER} .
docker push dinethshakya/spring-boot-app:${BUILD_NUMBER}
```

**Image Versioning**:

- Tag format: `dinethshakya/spring-boot-app:<BUILD_NUMBER>`
- Example: `dinethshakya/spring-boot-app:42`
- Each build creates a uniquely versioned image

**Required Credential**: `dockerhub-credentials` (Jenkins username/password)

### 5️⃣ Update Deployment File (GitOps)

**Purpose**: Automatically update Kubernetes deployment configuration

**Process**:

1. Clone the GitHub repository
2. Update `deployment.yml` with new image version
3. Commit changes with message: `"Update deployment image to version ${BUILD_NUMBER}"`
4. Push to GitHub main branch
5. ArgoCD detects the change and triggers Kubernetes deployment

**Required Credential**: `github-ci-cd` (Jenkins secret text with GitHub PAT)

**Git Operations**:

```bash
# Update image version in deployment.yml
sed -i "s|dinethshakya/spring-boot-app:[0-9]*|dinethshakya/spring-boot-app:${BUILD_NUMBER}|g" deployment.yml

# Commit and push
git add deployment.yml
git commit -m "Update deployment image to version ${BUILD_NUMBER}"
git push origin main
```

## Jenkins Setup

### Custom Jenkins Agent

The pipeline uses a custom Docker agent with pre-installed tools:

**Image**: `dinethshakya/maven-docker-agent:java17-v1`

**Included Tools**:

- Maven 3.x
- Java 17 runtime
- Docker CLI
- Git

**Agent Configuration**:

```groovy
agent {
  docker {
    image 'dinethshakya/maven-docker-agent:java17-v1'
    args '--user root -v /var/run/docker.sock:/var/run/docker.sock'
  }
}
```

> [!NOTE]
> The Docker socket mounting (`-v /var/run/docker.sock:/var/run/docker.sock`) enables Docker-in-Docker functionality, allowing the Jenkins agent to build and push Docker images.

### Required Jenkins Credentials

Configure these credentials in **Jenkins → Manage Jenkins → Manage Credentials**:

| Credential ID           | Type              | Description                    | Permissions Required |
| ----------------------- | ----------------- | ------------------------------ | -------------------- |
| `Token_For_SonarQube`   | Secret text       | SonarQube authentication token | Execute analysis     |
| `dockerhub-credentials` | Username/Password | Docker Hub account             | Push images          |
| `github-ci-cd`          | Secret text       | GitHub Personal Access Token   | Read/write repo      |

### Environment Variables

The pipeline uses these environment variables:

```groovy
environment {
  DOCKER_REGISTRY = 'https://index.docker.io/v1/'
  SONAR_URL = 'http://13.235.41.162:9000'
  GIT_USER_NAME = 'DinethShakya23'
  GIT_USER_EMAIL = 'dinethshakya19@gmail.com'
  GIT_REPO_NAME = 'CI-CD-pipeline-spring-boot'
  DOCKER_IMAGE = "dinethshakya/spring-boot-app:${BUILD_NUMBER}"
}
```

> [!IMPORTANT]
> Update `SONAR_URL`, `GIT_USER_NAME`, `GIT_USER_EMAIL`, and image names to match your setup before running the pipeline.

### Creating the Jenkins Pipeline

1. **Create New Pipeline Job**:
   - Navigate to Jenkins dashboard
   - Click "New Item"
   - Enter job name (e.g., "spring-boot-cicd")
   - Select "Pipeline" and click OK

2. **Configure Pipeline**:
   - Under "Pipeline" section, select "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: `https://github.com/DinethShakya23/CI-CD-pipeline-spring-boot.git`
   - Credentials: Select your GitHub credentials
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`

3. **Configure Build Triggers** (optional):
   - Enable "GitHub hook trigger for GITScm polling" for automatic builds

4. **Save and Build**:
   - Click "Save"
   - Click "Build Now" to run the pipeline

## Docker Configuration

### Dockerfile Explanation

```dockerfile
# Base image: Alpine Linux with Java 11 JRE (lightweight)
FROM adoptopenjdk/openjdk11:alpine-jre

# JAR artifact location from Maven build
ARG artifact=target/spring-boot-web.jar

# Application working directory
WORKDIR /opt/app

# Copy JAR into container
COPY ${artifact} app.jar

# Run Spring Boot application
ENTRYPOINT ["java","-jar","app.jar"]
```

**Image Size**: ~120 MB (Alpine base reduces size significantly)

**Port Exposure**: Spring Boot runs on port 8080 (configured in Kubernetes deployment)

### Building Locally

```bash
# Build the JAR
mvn clean package

# Build Docker image
docker build -t spring-boot-app:local .

# Run locally
docker run -p 8080:8080 spring-boot-app:local

# Access application
curl http://localhost:8080
```

## Kubernetes Deployment

### Deployment Manifest

The [deployment.yml](./deployment.yml) defines:

**Deployment Specification**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
spec:
  replicas: 2 # High availability
  selector:
    matchLabels:
      app: spring-boot-app
  template:
    spec:
      containers:
        - name: spring-boot-app
          image: dinethshakya/spring-boot-app:1 # Updated by pipeline
          ports:
            - containerPort: 8080
```

**Service Specification**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: spring-boot-service
spec:
  type: NodePort # Accessible externally
  selector:
    app: spring-boot-app
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
```

### Manual Deployment

```bash
# Apply deployment and service
kubectl apply -f deployment.yml

# Check deployment status
kubectl get deployments

# Check pods
kubectl get pods -l app=spring-boot-app

# Get service details
kubectl get service spring-boot-service

# Access application (minikube)
minikube service spring-boot-service
```

### Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment spring-boot-app --replicas=5

# Verify scaling
kubectl get deployments
```

## Installation and Setup

### Local Development Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/DinethShakya23/CI-CD-pipeline-spring-boot.git
   cd CI-CD-pipeline-spring-boot
   ```

2. **Build the Application**:

   ```bash
   mvn clean package
   ```

3. **Run Locally**:

   ```bash
   java -jar target/spring-boot-web.jar
   ```

4. **Access Application**:
   ```
   http://localhost:8080
   ```

### Full CI/CD Pipeline Setup

#### Step 1: SonarQube Setup

```bash
# Run SonarQube (Docker)
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Access SonarQube
# http://localhost:9000 (admin/admin)

# Generate authentication token
# Administration → Security → Users → Generate Token
```

#### Step 2: Jenkins Setup

1. **Install Jenkins** (Docker recommended):

   ```bash
   docker run -d -p 8080:8080 -p 50000:50000 \
     -v jenkins_home:/var/jenkins_home \
     -v /var/run/docker.sock:/var/run/docker.sock \
     jenkins/jenkins:lts
   ```

2. **Install Required Plugins**:
   - Docker Pipeline
   - SonarQube Scanner
   - GitHub Integration

3. **Configure Credentials** (see [Jenkins Setup](#jenkins-setup))

#### Step 3: Kubernetes Setup

```bash
# Install Minikube (local testing)
minikube start

# Or use cloud provider (EKS example)
eksctl create cluster --name spring-boot-cluster --region us-east-1
```

#### Step 4: ArgoCD Setup

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Create Application
argocd app create spring-boot-app \
  --repo https://github.com/DinethShakya23/CI-CD-pipeline-spring-boot.git \
  --path . \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default \
  --sync-policy automated
```

#### Step 5: Run the Pipeline

1. Commit code changes to GitHub
2. Jenkins automatically triggers pipeline
3. Pipeline completes all 5 stages
4. ArgoCD detects deployment.yml update
5. New version deploys to Kubernetes

<!-- ## GitOps Workflow

### How It Works

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant J as Jenkins
    participant DH as Docker Hub
    participant A as ArgoCD
    participant K as Kubernetes

    Dev->>GH: Push code
    GH->>J: Trigger webhook
    J->>J: Build & Test
    J->>J: SonarQube scan
    J->>DH: Push image v42
    J->>GH: Update deployment.yml (v42)
    A->>GH: Poll for changes
    A->>A: Detect deployment.yml change
    A->>K: Apply new deployment
    K->>DH: Pull image v42
    K->>K: Rolling update
``` -->

### Benefits

- 🔒 **Single Source of Truth**: Git repo contains desired state
- 🔄 **Automatic Sync**: ArgoCD ensures cluster matches repo
- 📜 **Audit Trail**: All changes tracked in Git history
- ⏪ **Easy Rollback**: Revert Git commit to rollback deployment
- 🔐 **Security**: No cluster credentials needed in CI pipeline

## Application Details

### Spring Boot Application

<!-- **Main Class**: `com.application.StartApplication` -->

**Endpoints**:

- `GET /` - Home page with deployment confirmation message

**Response**:

```
Title: "I have successfully built a Spring Boot application using Maven"
Message: "This application is deployed on to Kubernetes using Argo CD"
```

### Maven Configuration

**Key Dependencies**:

- `spring-boot-starter-web` - REST API support
- `spring-boot-starter-thymeleaf` - Template engine
- `spring-boot-starter-test` - Testing framework
- `spring-boot-devtools` - Development tools

**Build Output**: `target/spring-boot-web.jar`

## Monitoring and Maintenance

### Pipeline Monitoring

**Jenkins Dashboard**:

- View build history and trends
- Monitor build duration
- Check test results
- Review console logs

**SonarQube Dashboard**:

- Code quality metrics
- Security vulnerabilities
- Code coverage trends
- Technical debt

### Kubernetes Monitoring

```bash
# View pod logs
kubectl logs -f deployment/spring-boot-app

# Check pod health
kubectl get pods -l app=spring-boot-app

# Describe deployment
kubectl describe deployment spring-boot-app

# View events
kubectl get events --sort-by='.lastTimestamp'
```

### ArgoCD Monitoring

- Application sync status
- Deployment history
- Health status of resources
- Rollback capabilities via UI

## Security Considerations

### Credential Management

> [!CAUTION]
> Never commit credentials to Git. Always use Jenkins credential vault.

**Best Practices**:

- ✅ Use Jenkins credentials for all secrets
- ✅ Rotate tokens regularly
- ✅ Use least-privilege access
- ✅ Enable GitHub 2FA
- ✅ Use read-only SonarQube tokens when possible

### Docker Socket Security

> [!WARNING]
> Mounting `/var/run/docker.sock` grants root access to the Docker daemon. Only use in trusted environments.

**Mitigation**:

- Use dedicated Jenkins agent node
- Implement network segmentation
- Consider Docker-in-Docker alternatives (buildah, kaniko)

### Image Security

**Recommendations**:

- Use specific base image tags (avoid `latest`)
- Scan images for vulnerabilities (Trivy, Clair)
- Use minimal base images (Alpine)
- Implement image signing

### Kubernetes Security

- Use namespaces for isolation
- Implement RBAC policies
- Use network policies
- Enable pod security policies

## Troubleshooting

### Build Failures

**Issue**: Maven build fails with dependency errors

```bash
# Solution: Clear Maven cache
mvn dependency:purge-local-repository
mvn clean install
```

**Issue**: Tests fail in Jenkins but pass locally

- Check Java version compatibility
- Verify environment variables
- Review test logs in Jenkins console

### Docker Push Errors

**Issue**: `unauthorized: authentication required`

```bash
# Solution: Verify credentials
# 1. Check dockerhub-credentials in Jenkins
# 2. Test locally
docker login
docker push dinethshakya/spring-boot-app:test
```

**Issue**: `denied: requested access to the resource is denied`

- Verify Docker Hub repository exists
- Check repository permissions
- Ensure username matches in image tag

### SonarQube Connection Issues

**Issue**: `Failed to connect to SonarQube server`

**Solutions**:

1. Verify SonarQube URL is accessible from Jenkins
   ```bash
   curl http://13.235.41.162:9000
   ```
2. Check SonarQube server status
3. Verify authentication token is valid
4. Check firewall rules

### Kubernetes Deployment Failures

**Issue**: Pods in `ImagePullBackOff` state

```bash
# Check pod events
kubectl describe pod <pod-name>

# Solutions:
# 1. Verify image exists in Docker Hub
# 2. Check image tag in deployment.yml
# 3. Verify Kubernetes can reach Docker Hub
```

**Issue**: Pods in `CrashLoopBackOff` state

```bash
# Check logs
kubectl logs <pod-name>

# Common causes:
# - Application port mismatch
# - Missing environment variables
# - Application startup errors
```

### Git Push Authentication Problems

**Issue**: `Authentication failed` when updating deployment.yml

**Solutions**:

1. Verify GitHub token has `repo` scope
2. Check token hasn't expired
3. Ensure token belongs to repository owner
4. Test token:
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
   ```

### ArgoCD Sync Issues

**Issue**: ArgoCD doesn't detect changes

- Check ArgoCD polling interval
- Verify repository URL is correct
- Manually sync via ArgoCD UI
- Check ArgoCD application logs

<!-- ## Future Enhancements

### Planned Improvements

1. **Multi-Environment Support**
   - Separate deployments for dev, staging, production
   - Environment-specific configurations
   - Blue-green deployments

2. **Enhanced Testing**
   - Integration tests in pipeline
   - Contract testing
   - Performance testing with JMeter
   - Smoke tests post-deployment

3. **Security Enhancements**
   - Image vulnerability scanning (Trivy)
   - OWASP dependency check
   - Secrets management (Vault, Sealed Secrets)
   - Container runtime security (Falco)

4. **Monitoring & Observability**
   - Prometheus metrics
   - Grafana dashboards
   - ELK stack for centralized logging
   - Distributed tracing (Jaeger)

5. **Advanced Deployment Strategies**
   - Canary deployments
   - A/B testing
   - Automatic rollback on failure
   - Progressive delivery with Flagger

6. **Infrastructure as Code**
   - Terraform for cloud resources
   - Helm charts for Kubernetes
   - Ansible for configuration management -->

---

<!-- ## 📝 License

This project is created for educational and demonstration purposes. -->

<!-- ## 👤 Author

**Dineth Shakya**
- GitHub: [@DinethShakya23](https://github.com/DinethShakya23)
- Email: dinethshakya19@gmail.com

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- Jenkins, SonarQube, Docker, and Kubernetes communities
- ArgoCD team for GitOps tooling -->

---

**Last Updated**: February 2026
