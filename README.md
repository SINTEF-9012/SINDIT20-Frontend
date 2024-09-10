[![Quality Gate Status](https://kubikk-ekkolodd.sintef.cloud/api/project_badges/measure?branch=sindit&project=SINDIT-Frontend&metric=alert_status&token=sqb_da2a79b20ba8379cfa3492a1a8bb59674a2cda0d)](https://kubikk-ekkolodd.sintef.cloud/dashboard?id=SINDIT-Frontend&branch=sindit)

![Static Badge](https://img.shields.io/badge/4.1-blue?style=flat&logo=svelte&label=svelte)
![Static Badge](https://img.shields.io/badge/2.10-blue?style=flat&label=skeletonlabs)
![Static Badge](https://img.shields.io/badge/5.4-blue?style=flat&logo=vite&label=vite)
![Static Badge](https://img.shields.io/badge/5.5-blue?style=flat&logo=typescript&label=typescript)
![Static Badge](https://img.shields.io/badge/0.5-blue?style=flat&logo=tailwindcss&label=tailwind)


# SINDIT Frontend
This is the frontend of SINDIT (Work in progress!)

## Developing

Installed dependencies with `npm install`, and start a development server:

```bash
npm run dev
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.


## Run docker image from Container registry

1. Create a [Private Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) with `read_registry` scope.
    - Docker login username: your gitlab username (email address) `$USERNAME`
    - Docker login password: your Personal Access Token `$CONTAINER_REGITRY_READ`
2. Login to gitlab container registry `docker login gitlab.sintef.no:5050 -u $USERNAME -p $CONTAINER_REGISTRY_READ`


```BASH
docker run -p 5173:5173 gitlab.sintef.no:5050/sct/sd/monorepo/sindit-frontend:latest
```
