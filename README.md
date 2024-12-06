[![Quality Gate Status](https://kubikk-ekkolodd.sintef.cloud/api/project_badges/measure?branch=sindit&project=SINDIT-Frontend&metric=alert_status&token=sqb_da2a79b20ba8379cfa3492a1a8bb59674a2cda0d)](https://kubikk-ekkolodd.sintef.cloud/dashboard?id=SINDIT-Frontend&branch=sindit)
[![Coverage](https://kubikk-ekkolodd.sintef.cloud/api/project_badges/measure?branch=sindit-frontend&project=SINDIT-Frontend&metric=coverage&token=sqb_da2a79b20ba8379cfa3492a1a8bb59674a2cda0d)](https://kubikk-ekkolodd.sintef.cloud/dashboard?id=SINDIT-Frontend&branch=sindit-frontend)
[![Vulnerabilities](https://kubikk-ekkolodd.sintef.cloud/api/project_badges/measure?branch=sindit-frontend&project=SINDIT-Frontend&metric=vulnerabilities&token=sqb_da2a79b20ba8379cfa3492a1a8bb59674a2cda0d)](https://kubikk-ekkolodd.sintef.cloud/dashboard?id=SINDIT-Frontend&branch=sindit-frontend)

![Static Badge](https://img.shields.io/badge/4.1-blue?style=flat&logo=svelte&label=svelte)
![Static Badge](https://img.shields.io/badge/2.10-blue?style=flat&label=skeletonlabs)
![Static Badge](https://img.shields.io/badge/5.4-blue?style=flat&logo=vite&label=vite)
![Static Badge](https://img.shields.io/badge/5.5-blue?style=flat&logo=typescript&label=typescript)
![Static Badge](https://img.shields.io/badge/0.5-blue?style=flat&logo=tailwindcss&label=tailwind)


# SINDIT Frontend
This is the frontend of SINDIT (Work in progress!)

## Documentation
The SINDIT 2.0 documentation is hosted on GitLab Pages: [sct.pages.sintef.no/sd/monorepo/sindit](https://sct.pages.sintef.no/sd/monorepo/sindit/overview/)

## Environment

There are environment variables you need for the frontend to run -- the URL to the backend API and the base URI of the backend. The simplest way is to create a `.env` file in the present directory.

```sh
$ cat .env
PUBLIC_SINDIT_BACKEND_API=http://192.168.1.222:9017
PUBLIC_SINDIT_BACKEND_API_BASE_URI=http://
```

Where `192.168.1.222` is the IP address of the machine running the backend. If the backend runs on the same machine as the frontend, that's fine. If the backend runs in a Docker container, you must specificy the IP address of the host. **You cannot use `0.0.0.0` or `127.0.0.1`!**

## Developing

Install dependencies with `npm install`, and start a development server:
```bash
npm install
npm run dev
```

Run tests:
```bash
npm run test
```

### Run using vscode Run & Debug launcher

This configuration can be applied to launch the application:
```bash
    "configurations": [
        {
            "command": "npm run dev",
            "name": "Run npm dev",
            "request": "launch",
            "type": "node-terminal"
        }
    ]
```

In development mode, the frontend is available at http://localhost:5173.

## Run frontend in docker

Build and run the sindit frontend:
```bash
docker build -t sindit-frontend .
docker run --env-file .env -d -p 5173:3000 --name sindit-frontend sindit-frontend
```

In this mode, the frontend is also available at http://localhost:5173.

## Run docker image from Container registry

1. Create a [Private Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) with `read_registry` scope.
    - Docker login username: your gitlab username (email address) `$DOCKER_USERNAME`
    - Docker login password: your Personal Access Token `$CONTAINER_REGITRY_READ`
2. Login to gitlab container registry `docker login gitlab.sintef.no:5050 -u $DOCKER_USERNAME -p $CONTAINER_REGISTRY_READ`


```BASH
docker run -p 5173:3000 --name sindit-frontend gitlab.sintef.no:5050/sct/sd/monorepo/sindit-frontend:latest
```

## Run the backend
Details about how to run the SINDIT backend is found in the project directory [monorepo/projects/sindit](https://gitlab.sintef.no/sct/sd/monorepo/-/blob/sindit/projects/sindit/README.md?ref_type=heads)

Or in the documentation: [sct.pages.sintef.no/sd/monorepo/sindit/sindit-backend](https://sct.pages.sintef.no/sd/monorepo/sindit/sindit-backend/)

The URL and the URI-prefix of the backend are defined as environment variables (`PUBLIC_SINDIT_BACKEND_API` and `PUBLIC_SINDIT_BACKEND_API_BASE_URI`), see also the subsection *Environment* above.
