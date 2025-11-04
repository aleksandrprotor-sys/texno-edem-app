{
  "name": "texno-edem-app",
  "version": "1.0.0",
  "description": "Telegram Mini App магазин электроники Техно-Едем",
  "main": "index.html",
  "scripts": {
    "start": "python3 -m http.server 8000 || python -m http.server 8000 || npx http-server -p 8000",
    "dev": "npx live-server --port=3000",
    "serve": "npx http-server . -p 8080 -o",
    "deploy": "git add . && git commit -m 'Deploy update' && git push origin main"
  },
  "keywords": [
    "telegram",
    "mini-app",
    "ecommerce",
    "electronics",
    "store"
  ],
  "author": "Aleksandr Protor",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/aleksandrprotor-sys/texno-edem-app"
  },
  "homepage": "https://aleksandrprotor-sys.github.io/texno-edem-app"
}
