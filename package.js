{
  "name": "texno-edem-app",
  "version": "1.0.0",
  "description": "Telegram Mini App магазин электроники Техно-Едем",
  "main": "index.html",
  "scripts": {
    "start": "python3 -m http.server 8000 || python -m http.server 8000 || npx http-server -p 8000",
    "dev": "npx live-server --port=3000",
    "build": "echo 'No build process needed for static HTML app'",
    "deploy": "git add . && git commit -m 'Deploy update' && git push origin main",
    "test": "echo 'No tests specified' && exit 0",
    "lint": "echo 'No linting configured'",
    "clean": "rm -rf node_modules",
    "serve": "npx http-server . -p 8080 -o"
  },
  "keywords": [
    "telegram",
    "mini-app",
    "ecommerce",
    "electronics",
    "store",
    "web-app",
    "pwa"
  ],
  "author": {
    "name": "Aleksandr Protor",
    "email": "aleksandrprotor-sys@example.com",
    "url": "https://github.com/aleksandrprotor-sys"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/aleksandrprotor-sys/texno-edem-app.git"
  },
  "bugs": {
    "url": "https://github.com/aleksandrprotor-sys/texno-edem-app/issues"
  },
  "homepage": "https://aleksandrprotor-sys.github.io/texno-edem-app",
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  },
  "devDependencies": {
    "http-server": "^14.1.1",
    "live-server": "^1.2.2"
  },
  "dependencies": {},
  "browserslist": [
    "last 2 versions",
    "> 1%",
    "IE 11"
  ],
  "telegram": {
    "miniApp": {
      "platform": "web",
      "url": "https://aleksandrprotor-sys.github.io/texno-edem-app"
    }
  }
}
