pipeline {
    agent any

    environment {
        DOCKER_USER = 'jagwar7' 
        IMAGE_NAME  = 'flash-auth-app'
        // Your Backend EC2 Private IP
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
                        // Fetching SecureStrings from AWS SSM
                        def mongoUri = sh(script: "aws ssm get-parameter --name 'jagwar_mongo_uri' --with-decryption --query 'Parameter.Value' --output text", returnStdout: true).trim()
                        def firebaseJson = sh(script: "aws ssm get-parameter --name 'jagwar-firebase-josn' --with-decryption --query 'Parameter.Value' --output text", returnStdout: true).trim()

                        // Transfer the docker-compose.yml to the target server
                        sh "scp -o StrictHostKeyChecking=no docker-compose.yml ubuntu@${FLASH_AUTH_PRIVATE_IP}:/home/ubuntu/"

                        // Remote deployment via SSH
                        sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${FLASH_AUTH_PRIVATE_IP} << 'EOF'
# Safely write the decrypted JSON to a file
# Note: JSON marker must be flush left!
cat << 'JSON' > /home/ubuntu/firebase-auth.json
${firebaseJson}
JSON

chmod 600 /home/ubuntu/firebase-auth.json

# Pull the latest image
docker pull ${DOCKER_USER}/${IMAGE_NAME}:latest

# Stop existing containers
docker-compose down --remove-orphans || true

# START COMMAND: Explicitly inject the MONGODB_URI into the compose process
MONGODB_URI='${mongoUri}' docker-compose up -d
EOF
                        """
                    }
                }
            }
        }
    }
}