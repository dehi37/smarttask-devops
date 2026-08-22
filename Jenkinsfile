pipeline {
    agent {
        label 'docker-agent'
    }

    environment {
        REGISTRY = 'docker.io'
        DOCKER_USER = 'dehilegod'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        
        BACKEND_IMAGE  = "${DOCKER_USER}/repsmarttask-backend"
        FRONTEND_IMAGE = "${DOCKER_USER}/repsmarttask-frontend"
        DB_IMAGE       = "${DOCKER_USER}/repsmarttask-db"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def gitCommitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()

                    if (BRANCH_NAME == 'dev') {
                        echo "--> Build des images pour l'environnement DEV..."
                        
                        sh "docker build -t ${BACKEND_IMAGE}:dev-latest -t ${BACKEND_IMAGE}:dev-${gitCommitHash} ./backend"
                        sh "docker build -t ${FRONTEND_IMAGE}:dev-latest -t ${FRONTEND_IMAGE}:dev-${gitCommitHash} ./frontend"
                        sh "docker build -t ${DB_IMAGE}:dev-latest -t ${DB_IMAGE}:dev-${gitCommitHash} ./db"
                    } 
                    else if (BRANCH_NAME == 'prod') {
                        echo "--> Build des images pour l'environnement PROD..."
                        
                        sh "docker build -t ${BACKEND_IMAGE}:latest -t ${BACKEND_IMAGE}:prod-latest -t ${BACKEND_IMAGE}:${gitCommitHash} ./backend"
                        sh "docker build -t ${FRONTEND_IMAGE}:latest -t ${FRONTEND_IMAGE}:prod-latest -t ${FRONTEND_IMAGE}:${gitCommitHash} ./frontend"
                        sh "docker build -t ${DB_IMAGE}:latest -t ${DB_IMAGE}:prod-latest -t ${DB_IMAGE}:${gitCommitHash} ./db"
                    }
                }
            }
        }

        stage('Docker Hub Authentication & Push') {
            steps {
                script {
                    echo "--> Connexion à Docker Hub et publication des images..."
                    
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh "echo \$PASS | docker login ${REGISTRY} -u \$USER --password-stdin"

                        def gitCommitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()

                        if (BRANCH_NAME == 'dev') {
                            sh "docker push ${BACKEND_IMAGE}:dev-latest"
                            sh "docker push ${BACKEND_IMAGE}:dev-${gitCommitHash}"

                            sh "docker push ${FRONTEND_IMAGE}:dev-latest"
                            sh "docker push ${FRONTEND_IMAGE}:dev-${gitCommitHash}"

                            sh "docker push ${DB_IMAGE}:dev-latest"
                            sh "docker push ${DB_IMAGE}:dev-${gitCommitHash}"
                        }
                        else if (BRANCH_NAME == 'prod') {
                            sh "docker push ${BACKEND_IMAGE}:latest"
                            sh "docker push ${BACKEND_IMAGE}:prod-latest"
                            sh "docker push ${BACKEND_IMAGE}:${gitCommitHash}"

                            sh "docker push ${FRONTEND_IMAGE}:latest"
                            sh "docker push ${FRONTEND_IMAGE}:prod-latest"
                            sh "docker push ${FRONTEND_IMAGE}:${gitCommitHash}"

                            sh "docker push ${DB_IMAGE}:latest"
                            sh "docker push ${DB_IMAGE}:prod-latest"
                            sh "docker push ${DB_IMAGE}:${gitCommitHash}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo "--> Nettoyage des sessions Docker..."
            sh "docker logout ${REGISTRY} || true"
        }
        success {
            echo "Pipeline exécuté avec succès !"
        }
        failure {
            echo "Échec du pipeline. Vérifiez les logs ci-dessus."
        }
    }
}
