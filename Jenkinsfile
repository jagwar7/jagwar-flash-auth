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
                }
            }
        }
    }
}