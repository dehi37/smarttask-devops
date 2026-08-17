pipeline {
    agent any

    environment {
        DOCKER_USER = 'dehilegod'
        BACKEND_IMAGE = "${DOCKER_USER}/smarttask-backend"
        FRONTEND_IMAGE = "${DOCKER_USER}/smarttask-frontend"
    }

    stages {
        stage('Récupération du Code') {
            steps {
                echo "Checkout de la branche ${env.BRANCH_NAME}..."
                checkout scm
            }
        }

        stage('Construction des Images Docker') {
            steps {
                script {
                    echo "Construction des images backend et frontend..."
                    sh "docker build -f Dockerfile.backend -t ${BACKEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER} -t ${BACKEND_IMAGE}:${env.BRANCH_NAME}-latest ."
                    sh "docker build -f Dockerfile.frontend -t ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER} -t ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-latest ."
                }
            }
        }

        stage('Publication sur Docker Hub') {
            steps {
                script {
                    echo "Connexion et publication des images..."
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_HUB_PASS')]) {
                        sh "echo \$DOCKER_HUB_PASS | docker login -u \$DOCKER_HUB_USER --password-stdin"
                        sh "docker push ${BACKEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER}"
                        sh "docker push ${BACKEND_IMAGE}:${env.BRANCH_NAME}-latest"
                        sh "docker push ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER}"
                        sh "docker push ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-latest"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline exécuté avec succès sur la branche ${env.BRANCH_NAME} !"
        }
        failure {
            echo "Échec du pipeline ! Consultez la Console Output."
        }
        always {
            sh "docker logout || true"
            cleanWs()
        }
    }
}
