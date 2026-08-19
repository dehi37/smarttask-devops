pipeline {
    agent {
        node {
            label 'docker-agent'
        }
    }

    environment {
        DOCKER_USER    = 'dehilegod'
        DOCKER_REPO    = 'repsmarttask'
        BACKEND_IMAGE  = "${DOCKER_USER}/${DOCKER_REPO}-backend"
        FRONTEND_IMAGE = "${DOCKER_USER}/${DOCKER_REPO}-frontend"
    }

    stages {
        stage('Publication sur Docker Hub') {
            steps {
                script {
                    echo "Connexion et publication des images sur Docker Hub..."
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-credentials', 
                        usernameVariable: 'DOCKER_HUB_USER', 
                        passwordVariable: 'DOCKER_HUB_PASS'
                    )]) {
                        sh 'echo "$DOCKER_HUB_PASS" | docker login -u "$DOCKER_HUB_USER" --password-stdin'
                        
                        // Push des images Backend
                        sh "docker push ${BACKEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER}"
                        sh "docker push ${BACKEND_IMAGE}:${env.BRANCH_NAME}-latest"
                        
                        // Push des images Frontend
                        sh "docker push ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-${BUILD_NUMBER}"
                        sh "docker push ${FRONTEND_IMAGE}:${env.BRANCH_NAME}-latest"
                    }
                }
            }
        }
    }
}
