pipeline {
    agent {
        label 'docker-agent'
    }

    environment {
        REGISTRY = 'docker.io'
        DOCKERHUB_USER = 'dehilegod'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'

        // Noms des 3 images sur Docker Hub
        BACKEND_IMAGE  = "${REGISTRY}/${DOCKERHUB_USER}/repsmarttask-backend"
        FRONTEND_IMAGE = "${REGISTRY}/${DOCKERHUB_USER}/repsmarttask-frontend"
        DB_IMAGE       = "${REGISTRY}/${DOCKERHUB_USER}/repsmarttask-db"

        POSTGRES_VOLUME = 'smarttask_postgres_data'
    }

    stages {
        stage('Checkout Source') {
            steps {
                echo "--> Récupération du code source depuis la branche : ${BRANCH_NAME}"
                checkout scm
            }
        }

        stage('Prepare Docker Infrastructure & Volumes') {
            steps {
                script {
                    echo "--> Vérification et création du volume persistant..."
                    sh "docker volume create ${POSTGRES_VOLUME} || true"
                }
            }
        }

        stage('Build & Tag Docker Images') {
            steps {
                script {
                    def gitCommitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()

                    if (BRANCH_NAME == 'dev') {
                        echo "--> Construction des images DEV..."
                        sh "docker build -t ${BACKEND_IMAGE}:dev-latest -t ${BACKEND_IMAGE}:dev-${gitCommitHash} ./backend"
                        sh "docker build -t ${FRONTEND_IMAGE}:dev-latest -t ${FRONTEND_IMAGE}:dev-${gitCommitHash} ./frontend"
                        sh "docker build -t ${DB_IMAGE}:dev-latest -t ${DB_IMAGE}:dev-${gitCommitHash} ./database"
                    }
                    else if (BRANCH_NAME == 'prod') {
                        echo "--> Construction des images PROD..."
                        sh "docker build -t ${BACKEND_IMAGE}:latest -t ${BACKEND_IMAGE}:prod-latest -t ${BACKEND_IMAGE}:${gitCommitHash} ./backend"
                        sh "docker build -t ${FRONTEND_IMAGE}:latest -t ${FRONTEND_IMAGE}:prod-latest -t ${FRONTEND_IMAGE}:${gitCommitHash} ./frontend"
                        sh "docker build -t ${DB_IMAGE}:latest -t ${DB_IMAGE}:prod-latest -t ${DB_IMAGE}:${gitCommitHash} ./database"
                    }
                }
            }
        }

        stage('Docker Hub Authentication & Push') {
            steps {
                script {
                    echo "--> Connexion au registre ${REGISTRY} et publication..."
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login ${REGISTRY} -u \$DOCKER_USER --password-stdin"

                        sh "docker push --all-tags ${BACKEND_IMAGE}"
                        sh "docker push --all-tags ${FRONTEND_IMAGE}"
                        sh "docker push --all-tags ${DB_IMAGE}"
                    }
                }
            }
        }
    }

    
    post {
        always {
            script {
                echo "--> Déconnexion du registre et nettoyage des images locales..."
                sh "docker logout ${REGISTRY}"

                // Supprime les images locales tagguées pour libérer l'espace disque du Serveur 1
                sh "docker rmi -f ${BACKEND_IMAGE}:latest ${BACKEND_IMAGE}:${BUILD_NUMBER} || true"
                sh "docker rmi -f ${FRONTEND_IMAGE}:latest ${FRONTEND_IMAGE}:${BUILD_NUMBER} || true"
                sh "docker rmi -f ${DB_IMAGE}:latest ${DB_IMAGE}:${BUILD_NUMBER} || true"

                // Nettoie les calques temporaires restants
                sh "docker image prune -f"
            }
        }
    }
}
}
