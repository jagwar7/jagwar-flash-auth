pipeline {
    agent any
    
    environment {
        AWS_REGION            = 'ap-southeast-2'
        AWS_ACCOUNT_ID        = '696737009734'
        ECR_REPO_NAME         = 'ecr-flashauth-backend'
        ECR_REPO_URL          = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"
        FLASHAUTH_INSTANCE_ID = 'i-0289f0572d72abc0e'
        FLASHAUTH_S3_BUCKET   = 'flashauth-backend-s3-696737009734-ap-southeast-2-an'
    }

    stages {
        stage('#1. Checkout') {
            steps {
                checkout scm
            }
        }

        stage('#2. Build') {
            steps {
                echo "🛠️ Building image..."
                sh "docker build -t ${ECR_REPO_NAME}:latest ."
            }
        }

        stage('#3. Push') {
            steps {
                script {
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                    sh "docker tag ${ECR_REPO_NAME}:latest ${ECR_REPO_URL}:latest"
                    sh "docker push ${ECR_REPO_URL}:latest"
                    sh "aws s3 cp docker-compose.yml s3://${FLASHAUTH_S3_BUCKET}/flashauth-backend/docker-compose.yml" 
                }
            }
        }

        stage('#4. Deploy') {
            steps {
                script {
                    def getParam = { name ->
                        sh(script: "aws ssm get-parameter --name '$name' --with-decryption --query 'Parameter.Value' --output text --region ${AWS_REGION}", returnStdout: true).trim()
                    }

                    def rabbitHost      = getParam('/prod/notification-service/RABBIT_HOST')
                    def rabbitUsername  = getParam('/prod/notification-service/RABBIT_USERNAME')
                    def rabbitPassword  = getParam('/prod/notification-service/RABBIT_PASSWORD')
                    def mongodbURI      = getParam('jagwar_mongo_uri')
                    def firebaseConfig  = getParam('firebase_config.json')
                    def jwtSecretKey    = getParam('/prod/FLASHAUTH_BACKEND/jwt_secret_key')

                    def encodedFirebase = sh(script: "echo '${firebaseConfig}' | base64 -w 0", returnStdout: true).trim()
                    
                    sh """
                    aws ssm send-command \
                    --instance-ids ${FLASHAUTH_INSTANCE_ID} \
                    --region ${AWS_REGION} \
                    --document-name "AWS-RunShellScript" \
                    --parameters 'commands=[
                        \"aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com\",
                        \"mkdir -p /home/ubuntu/flashauth-backend\",
                        \"echo ${encodedFirebase} | base64 -d > /home/ubuntu/flashauth-backend/firebase_config.json\",
                        \"cat <<EOF > /home/ubuntu/flashauth-backend/.env
ENV_CONTAINER_PORT=5800
ENV_SYSTEM_PORT=5850
ENV_RABBIT_HOST=${rabbitHost}
ENV_RABBIT_USER=${rabbitUsername}
ENV_RABBIT_PASSWORD=${rabbitPassword}
MONGODB_CONNECTION_URL=${mongodbURI}
JWT_SECRET_KEY=${jwtSecretKey}
ENV_DOCKER_IMAGE_URL=${ECR_REPO_URL}:latest
EOF\",
                        \"aws s3 cp s3://${FLASHAUTH_S3_BUCKET}/flashauth-backend/docker-compose.yml /home/ubuntu/flashauth-backend/docker-compose.yml\",
                        \"cd /home/ubuntu/flashauth-backend && docker compose pull\",
                        \"cd /home/ubuntu/flashauth-backend && docker compose up -d\",
                        \"docker ps -a\"
                    ]'
                    """
                }
            }
        }
    }

    post {
        success { echo "🌐🚀 Deployed Successfully" }
        failure { echo "❌⛔ Deployment Failed" }
        always {
            sh "docker rmi ${ECR_REPO_NAME}:latest || true"
            sh "docker rmi ${ECR_REPO_URL}:latest || true"
        }
    }
}