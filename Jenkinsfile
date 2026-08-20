pipeline {
    agent {
        label 'docker-agent'
    }

    environment {
        // Définition du registre Docker (Docker Hub)
        REGISTRY = 'docker.io/repsmarttask'
        DOCKERHUB_USER = 'dehilegod'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        
        // Nom complet des images avec le Registre
        BACKEND_IMAGE  = "${REGISTRY}/${DOCKERHUB_USER}/repsmarttask-backend"
        FRONTEND_IMAGE = "${REGISTRY}/${DOCKERHUB_USER}/repsmarttask-frontend"
        
        // Volume persistant pour la BDD
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
                        echo "--> Construction pour l'environnement DEV sur ${REGISTRY}..."
                        sh "docker build -t ${BACKEND_IMAGE}:dev-latest -t ${BACKEND_IMAGE}:dev-${gitCommitHash} ./backend"
                        sh "docker build -t ${FRONTEND_IMAGE}:dev-latest -t ${FRONTEND_IMAGE}:dev-${gitCommitHash} ./frontend"
                    } 
                    else if (BRANCH_NAME == 'prod') {
                        echo "--> Construction pour l'environnement PROD sur ${REGISTRY}..."
                        sh "docker build -t ${BACKEND_IMAGE}:latest -t ${BACKEND_IMAGE}:prod-latest -t ${BACKEND_IMAGE}:${gitCommitHash} ./backend"
                        sh "docker build -t ${FRONTEND_IMAGE}:latest -t ${FRONTEND_IMAGE}:prod-latest -t ${FRONTEND_IMAGE}:${gitCommitHash} ./frontend"
                    }
                    else {
                        echo "--> Construction pour branche secondaire (${BRANCH_NAME})..."
                        sh "docker build -t ${BACKEND_IMAGE}:${BRANCH_NAME} ./backend"
                        sh "docker build -t ${FRONTEND_IMAGE}:${BRANCH_NAME} ./frontend"
                    }
                }
            }
        }

        stage('Docker Hub Authentication & Push') {
            steps {
                script {
                    echo "--> Connexion au registre ${REGISTRY} et publication des images..."
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login ${REGISTRY} -u \$DOCKER_USER --password-stdin"
                        
                        // Push des images vers le registre
                        sh "docker push --all-tags ${BACKEND_IMAGE}"
                        sh "docker push --all-tags ${FRONTEND_IMAGE}"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "--> Déconnexion du registre Docker..."
            sh "docker logout ${REGISTRY}"
        }
        success {
            echo "Pipeline exécuté avec succès pour la branche ${BRANCH_NAME} !"
        }
        failure {
            echo "ERREUR : Le pipeline a échoué."
        }
    }
}
