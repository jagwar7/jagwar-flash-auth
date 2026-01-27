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
                        def mongoUri = sh(script: "aws ssm get-parameter --name 'jagwar_mongo_uri' --with-decryption --query 'Parameter.Value' --output text", returnStdout: true).trim()
                        def firebaseJson = sh(script: "aws ssm get-parameter --name 'jagwar-firebase-josn' --with-decryption --query 'Parameter.Value' --output text", returnStdout: true).trim()

                        sh "scp -o StrictHostKeyChecking=no docker-compose.yml ubuntu@${FLASH_AUTH_PRIVATE_IP}:/home/ubuntu/"

                        sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${FLASH_AUTH_PRIVATE_IP} << 'EOF'

# CREATE FIREBAS CONFIG FOR AUTH
cat << 'JSON' > /home/ubuntu/firebase-auth.json
${firebaseJson}
JSON

# CREATE .ENV FILE FOR DOCKER REQUIREMENT 
cat << 'ENV_FILE' > /home/ubuntu/.env
FIREBASE_CONFIG_PATH=./firebase-auth.json
PORT=5800
MONGODB_CONNECTION_URL='${mongoUri}'
REDIS_URL=redis://redis:6379
NODE_ENV=production
ENV_FILE


chmod 600 /home/ubuntu/firebase-auth.json /home/ubuntu/.env

docker pull ${DOCKER_USER}/${IMAGE_NAME}:latest
docker compose down --remove-orphans || true
docker compose up -d
EOF
                        """
                    }
                }
            }
        }
    }
}