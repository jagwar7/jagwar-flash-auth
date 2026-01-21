pipeline {
    agent any

    environment {
        DOCKER_USER = 'jagwar7' 
        IMAGE_NAME  = 'flash-auth-app'
        // Using the Private IP for security (as you provided)
        FLASH_AUTH_PRIVATE_IP = '172.31.47.118'
    }

    stages {
        stage('1. Fetch Code') {
            steps {
                checkout scm
            }
        }

        stage('2. Build Docker Image') {
            steps {
                // Building the image specifically for production
                sh "docker build -t ${DOCKER_USER}/${IMAGE_NAME}:latest ./server"
            }
        }

        stage('3. Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DOCKER-HUB-CREDS', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    sh "echo ${PASS} | docker login -u ${USER} --password-stdin"
                    sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:latest"
                }
            }
        }

        stage('4. Deploy to Backend EC2') {
            steps {
                sshagent(['FLASH-AUTH-EC2']) {
                    script {
                        // Fetching SecureStrings with decryption enabled
                        def mongoUri = sh(script: "aws ssm get-parameter --name 'jagwar_mongo_uri' --with-decryption --query 'Parameter.Value' --output text", returnStdout: true).trim()
                        def firebaseJson = sh(script: "aws ssm get-parameter --name 'jagwar-firebase-josn' --with-decryption --query 'Parameter.Value' --output text", returnStdout: true).trim()

                        // Transfer the docker-compose.yml
                        sh "scp -o StrictHostKeyChecking=no docker-compose.yml ubuntu@${FLASH_AUTH_PRIVATE_IP}:/home/ubuntu/"

                        // Remote deployment via SSH
                        sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${FLASH_AUTH_PRIVATE_IP} << 'EOF'
                            # Safely write the decrypted JSON to a file
                            cat << 'JSON' > /home/ubuntu/firebase-auth.json
                            ${firebaseJson}
                            JSON
                            
                            # Set permissions so only the owner can read the sensitive file
                            chmod 600 /home/ubuntu/firebase-auth.json
                            
                            export MONGODB_URI='${mongoUri}'
                            
                            docker pull ${DOCKER_USER}/${IMAGE_NAME}:latest
                            docker-compose down || true
                            docker-compose up -d
                        EOF
                        """
                    }
                }
            }
        }
    }
}