pipeline {
    agent any

    environment {
        APP_NAME = 'smarttask'
        REGISTRY = 'docker.io/votre-user-dockerhub'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: "${env.BRANCH_NAME}", url: 'https://github.com/dehi37/smarttask-devops.git'
            }
        }

        stage('Code Analysis / Lint') {
            steps {
                echo 'Analyse du code source JavaScript/SQL...'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    sh 'docker build -f Dockerfile.backend -t ${REGISTRY}/${APP_NAME}-backend:${env.BRANCH_NAME} .'
                    sh 'docker build -f Dockerfile.frontend -t ${REGISTRY}/${APP_NAME}-frontend:${env.BRANCH_NAME} .'
                }
            }
        }

        stage('Test Infrastructure') {
            steps {
                sh 'docker-compose config'
            }
        }

        stage('Deploy (Production Only)') {
            when {
                branch 'prod'
            }
            steps {
                sh 'docker-compose down'
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
