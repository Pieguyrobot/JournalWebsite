## problem

the website works on `http://pieguyrobot.com:3000` but not on `http://pieguyrobot.com` because you had no reverse proxy (nginx) to route traffic from port 80 to the correct services, and your cors configuration was too restrictive

## solution

use nginx as a reverse proxy to serve the frontend on port 80 and route `/api/*` requests to the backend on port 5000

this should also make it (hopefully) easy to add HTTPS in the future

## how to set this up

### 1. install nginx for windows

1. go to http://nginx.org/en/download.html
2. download the windows ver
3. extract the zip to `C:\nginx`
4. then you should have `C:\nginx\nginx.exe`

### 2. start nginx

you wanna modify your local nginx file (C:/nginx/conf/nginx.conf) by adding the stuff from the nginx config file that i put in your repo, then run this command to start it (you might need to start and then quit it if the config isn't there already)

```
cd C:\nginx
nginx.exe
# (i think you might have to run nginx as administrator on windows)
```
   
### 3. start the frontend

```
cd frontend
npm install
npm start
```

### 4. start the backend

```
cd backend
npm install
node server.js
```