// ============================================================================
// CI/CD Pipeline for Spring Boot Application by Dineth Shakya
// Stages: Build → Test → Code Analysis → Docker Build/Push → GitOps Update
// ============================================================================
pipeline {
  options {
    disableConcurrentBuilds()
  }
  agent {
    docker {
      image 'dinethshakya/maven-docker-agent:java17-v1'
      args '-v /var/run/docker.sock:/var/run/docker.sock'
    }
  }
  environment {
    DOCKER_REGISTRY = 'https://index.docker.io/v1/'
    SONAR_URL = 'http://13.235.41.162:9000'
    GIT_USER_NAME = 'DinethShakya23'
    GIT_USER_EMAIL = '150885267+DinethShakya23@users.noreply.github.com.'
    GIT_REPO_NAME = 'CI-CD-pipeline-spring-boot'
  }
  stages {
      stage('Check Commit Author') {
        steps {
          script {
            def commitAuthor = sh(script: 'git log -1 --pretty=format:%an', returnStdout: true).trim()
            echo "Commit author: ${commitAuthor}"
            if (commitAuthor == 'DinethShakya23') {
              currentBuild.result = 'NOT_BUILT'
              error("Skipping build triggered by Jenkins commit")
            }
          }
        }
    }
    stage('Build and Test') {
      steps {
        echo 'Building and testing application...'
        sh 'mvn clean package'
      }
    }
    stage('Static Code Analysis') {
      steps {
        echo 'Running SonarQube analysis...'
        withCredentials([string(credentialsId: 'Token_For_SonarQube', variable: 'SONAR_AUTH_TOKEN')]) {
          sh 'mvn sonar:sonar -Dsonar.login=$SONAR_AUTH_TOKEN -Dsonar.host.url=${SONAR_URL}'
        }
      }
    }
    stage('Build and Push Docker Image') {
      steps {
        script {
          def imageName = "dinethshakya/spring-boot-app:${env.BUILD_NUMBER}"
          echo "Building Docker image: ${imageName}"
         
          sh "docker build -t ${imageName} ."
         
          docker.withRegistry("${DOCKER_REGISTRY}", 'dockerhub-credentials') {
            docker.image(imageName).push()
          }
         
          echo "Docker image ${imageName} pushed successfully"
        }
      }
    }
    stage('Update Deployment File') {
      steps {
        echo 'Updating deployment configuration...'
        withCredentials([string(credentialsId: 'github-ci-cd', variable: 'GITHUB_TOKEN')]) {
          sh '''
            git config user.email "${GIT_USER_EMAIL}"
            git config user.name "${GIT_USER_NAME}"
           
            sed -i "s|dinethshakya/spring-boot-app:[0-9]*|dinethshakya/spring-boot-app:${BUILD_NUMBER}|g" deployment.yml
           
            git add deployment.yml
            git commit -m "Update deployment image to version ${BUILD_NUMBER}"
            git push https://${GITHUB_TOKEN}@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME}.git HEAD:main
          '''
        }
      }
    }
  }
  post {
    always {
      echo 'Pipeline execution completed'
      cleanWs()  // Safe cleanup here, after all stages
    }
    success {
      echo 'Pipeline succeeded! Docker image built and deployment updated.'
    }
    failure {
      echo 'Pipeline failed! Check logs for errors.'
    }
  }
}
