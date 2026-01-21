pipeline {
    agent any

    environment {
        DOCKER_USER = 'jagwar7' 
        IMAGE_NAME  = 'flash-auth-app'
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
                        // 1. Fetch SecureStrings from AWS SSM
                        def mongoUri = sh(script: "aws ssm get-parameter --name 'jagwar_mongo_uri' --with-decryption --query 'Parameter.Value' --output text", returnStdout: true).trim()
                        def firebaseJson = sh(script: "aws ssm get-parameter --name 'jagwar-firebase-josn' --with-decryption --query 'Parameter.Value' --output text", returnStdout: true).trim()

                        // 2. Transfer the compose file
                        sh "scp -o StrictHostKeyChecking=no docker-compose.yml ubuntu@${FLASH_AUTH_PRIVATE_IP}:/home/ubuntu/"

                        // 3. Remote execution
                        sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${FLASH_AUTH_PRIVATE_IP} << 'EOF'
# Create Firebase JSON (Ensure JSON delimiter is flush left)
cat << 'JSON' > /home/ubuntu/firebase-auth.json
${firebaseJson}
JSON

chmod 600 /home/ubuntu/firebase-auth.json

# Pull and Reset
docker pull ${DOCKER_USER}/${IMAGE_NAME}:latest
docker-compose down --remove-orphans || true

# Inject the variable directly into the docker-compose command
MONGODB_URI='${mongoUri}' docker-compose up -d
EOF
                        """
                    }
                }
            }
        }
    }
}