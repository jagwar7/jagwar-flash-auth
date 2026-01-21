pipeline {
    agent any

    environment {
        DOCKER_USER = 'jagwar7' 
        IMAGE_NAME  = 'flash-auth-app'
    }

    stages {
        stage('1. Fetch Code') {
            steps {
                // This 'checkout' happens automatically if you use SCM mode
                checkout scm
            }
        }

        stage('2. Build Docker Image') {
            steps {
                // Build the image using the Dockerfile in your /server folder
                sh "docker build -t ${DOCKER_USER}/${IMAGE_NAME}:latest ./server"
            }
        }

        stage('3. Push to Docker Hub') {
            steps {
                // Use the nickname 'docker-hub-creds' you created in Jenkins
                withCredentials([usernamePassword(credentialsId: 'DOCKER-HUB-CREDS', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    sh "echo ${PASS} | docker login -u ${USER} --password-stdin"
                    sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:latest"
                }
            }
        }
    }
}
