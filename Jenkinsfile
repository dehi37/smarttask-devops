pipeline {
    agent any

    environment {
        DOCKER_USER    = 'dehilegod'
        DOCKER_REPO    = 'repsmarttask'
        BACKEND_IMAGE  = "${DOCKER_USER}/${DOCKER_REPO}-backend"
        FRONTEND_IMAGE = "${DOCKER_USER}/${DOCKER_REPO}-frontend"
    }

    stages {
        stage('Construction des Images Docker') {
            steps {
                script {
                    echo "Construction des images..."
                    sh "docker build -f Dockerfile.backend -t ${BACKEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER} -t ${BACKEND_IMAGE}:${env.BRANCH_NAME}-latest ."
                    sh "docker build -f Dockerfile.frontend -t ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER} -t ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-latest ."
                }
            }
        }
        stage('Publication sur Docker Hub') {
            steps {
                script {
                    echo "Publication..."
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_HUB_PASS')]) {
                        sh 'echo "$DOCKER_HUB_PASS" | docker login -u "$DOCKER_HUB_USER" --password-stdin'
                        sh "docker push ${BACKEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER}"
                        sh "docker push ${BACKEND_IMAGE}:${env.BRANCH_NAME}-latest"
                        sh "docker push ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER}"
                        sh "docker push ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-latest"
                    }
                }
            }
        }
    }
}
