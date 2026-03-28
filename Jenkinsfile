pipeline{
    agent any
    
    environment{
        AWS_REGION              = 'ap-southeast-2'
        AWS_ACCOUNT_ID          = '696737009734'
        ECR_REPO_NAME           = 'ecr-flashauth-backend'
        ECR_REPO_URL            = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"
        FLASHAUTH_INSTANCE_ID   = 'i-0289f0572d72abc0e'
        FLASHAUTH_S3_BUCKET     = 'flashauth-backend-s3-696737009734-ap-southeast-2-an'
    }

    stages {
        stage('#1. Checkout Flash Auth backend repo'){
            steps{
                checkout scm
            }
        }

        stage('#2. Build docker image'){
            steps{
                echo "🛠️ Building docker image of Flash⚡Auth backend"
                sh "docker build -t ${ECR_REPO_NAME}:latest ."
            }
        }

        stage('#3. Push built image to ECR'){
            steps{
                script{
                    echo "👨‍💻 Logging into AWS ECR..."
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

                    echo "➡️ Assiging tag to built image..."
                    sh "docker tag ${ECR_REPO_NAME}:latest ${ECR_REPO_URL}:latest"

                    echo "⏫ Pushing image to AWS ECR"
                    sh "docker push ${ECR_REPO_URL}:latest"

                    echo "⏫ Uploading compose file to S3..."
                    sh "aws s3 cp docker-compose.yml s3://${FLASHAUTH_S3_BUCKET}/flashauth-backend/docker-compose.yml" 
                }
            }
        }

        stage('#4. Deploy to EC2 via SSM'){
            steps{
                script{
                    echo "Fetching credentials from AWS parameter store..."
                    def getParam = {name ->
                        sh(script: "aws ssm get-parameter --name '$name' --with-decryption --query 'Parameter.Value' --output text --region ${AWS_REGION}", returnStdout: true).trim()
                    }

                    def rabbitHost      = getParam('/prod/notification-service/RABBIT_HOST')
                    echo "rabbit host: ${rabbitHost} "

                    def rabbitUsername  = getParam('/prod/notification-service/RABBIT_USERNAME')
                    echo "rabbitUsername: ${rabbitUsername} "

                    def rabbitPassword  = getParam('/prod/notification-service/RABBIT_PASSWORD')
                    echo "rabbitPassword: ${rabbitPassword} "

                    def mongodbURI      = getParam('jagwar_mongo_uri')
                    echo "MongoDB: ${mongodbURI}"

                    def firebaseConfig  = getParam('firebase_config.json')
                    echo "Firebase Config: ${firebaseConfig}"

                    def jwtSecretKey    = getParam('/prod/FLASHAUTH_BACKEND/jwt_secret_key')
                    echo "JWT Secret Key: ${jwtSecretKey}"

                    def encodedFirebase = sh(
                        script: "echo '${firebaseConfig}' | base64 -w 0",
                        returnStdout: true
                    ).trim()
                    
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
                        \"sudo chown -R ubuntu:ubuntu /home/ubuntu/flashauth-backend\",
                        \"cd /home/ubuntu/flashauth-backend\", 
                        \"sudo docker compose pull\", 
                        \"sudo docker compose up -d\"
                    ]'
                    """
                }
            }
        }
    }

    post{
        success{
            echo "🌐🚀 Successfully deployed Flash⚡Auth Backend"
        }
        failure{
            echo "❌⛔ Failed to deploy Flash⚡Auth, Check Jenkins pipeline log"
        }
        always{
            echo "🧹🧼 Cleaning up local built image..."
            sh "docker rmi ${ECR_REPO_NAME}:latest || true"
            sh "docker rmi ${ECR_REPO_URL}:latest || true"
        }
    }
}