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


## Run docker image from Container registry

1. Create a [Private Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) with `read_registry` scope.
    - Docker login username: your gitlab username (email address) `$USERNAME`
    - Docker login password: your Personal Access Token `$CONTAINER_REGITRY_READ`
2. Login to gitlab container registry `docker login gitlab.sintef.no:5050 -u $USERNAME -p $CONTAINER_REGISTRY_READ`


```BASH
docker run -p 5173:5173 gitlab.sintef.no:5050/sct/sd/monorepo/sindit-frontend:latest
```

## Run the backend
Details about how to run the SINDIT backend is found in the project directory [monorepo/projects/sindit](https://gitlab.sintef.no/sct/sd/monorepo/-/blob/sindit/projects/sindit/README.md?ref_type=heads)

Or in the documentation: [sct.pages.sintef.no/sd/monorepo/sindit/sindit-backend](https://sct.pages.sintef.no/sd/monorepo/sindit/sindit-backend/)

The frontend assumes the backend is exposing the REST API at `http://0.0.0.0:9017`.
This can be configured by creating a `.env` file in the root folder of the frontend `sindit-frontend/`, by setting the following variables:
```bash
VITE_SINDIT_BACKEND_API=http://0.0.0.0:9017
VITE_SINDIT_BACKEND_API_BASE_URI=http://
```

The backend base uri, is the uri prefix of the nodes in the backend.
It is currently, at time of writing, assumed by the backend that this prefix is `http://`, according to rdf standards.
