# dockernode-app

## Build for Docker
<pre>
mkdir dockernode
git clone git@github.com:mikarinneoracle/dockernode-app.git dockernode
cd dockernode
docker build -t dockernode-app .
</pre>

## Image
<pre>docker images dockernode-app</pre>

## Running
<pre>docker run -it --rm -p 49160:3000 dockernode-app</pre>

## Testing
<pre>curl "http://localhost:49160"</pre>

## Unit Testing
<pre>npm test</pre>

## Swagger
<pre>http://localhost:49160/swagger</pre>

## Docker-hub
<pre>mikarinneoracle/dockernode</pre>
