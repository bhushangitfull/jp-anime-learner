pipeline {
    agent any

    tools {
        // Use the exact name you gave your NodeJS installation in Global Tool Configuration
        nodejs 'node20' 
    }

    environment {
        // Vite often uses this to optimize builds
        NODE_ENV = 'production'
    }

    stages {
        stage('Checkout') {
            steps {
                // Jenkins automatically clones your repo if this is a "Pipeline from SCM" job
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // 'npm ci' is preferred for CI/CD as it's faster and uses package-lock.json
                sh 'npm ci' 
            }
        }

        stage('Build') {
            steps {
                // This generates the 'dist' folder containing your static website
                sh 'npm run build' 
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying static files from /dist folder...'
                // Example: Copy files to a web server directory
                // sh 'scp -r dist/* user@your-server:/var/www/html/'
            }
        }
    }

    post {
        always {
            // Clean up workspace to save disk space
            cleanWs()
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Pipeline failed. Check the Console Output for details.'
        }
    }
}