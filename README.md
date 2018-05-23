# NxExamples

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) using [Nrwl Nx](https://nrwl.io/nx).

## Table of Contents

* [Install Nx](#install-nx)
* [Creating an nx workspace](#creating-an-nx-workspace)
* [Angular-cli to nx workspace](#angular-cli-to-nx-workspace)
* [Creating an Application](#creating-an-application)
* [Creating a Library](#creating-a-library)
* [Creating Libraries with Tags](#creating-libraries-with-tags)
* [Creating components in a library or app](#creating-components)
* [Ngrx Store Generation](#ngrx-store-generation)
* [Updating Nx](#updating-nx)
* [Development server](#development-server)
* [Build](#build)
* [Running unit tests](#running-unit-tests)
* [Running end-to-end tests](#running-end-to-end-tests)
* [Affected Apps](#affected-apps)
* [Further Help](#further-help)

### Install Nx:

[Install](https://github.com/nrwl/nx-examples/tree/workspace):

The @nrwl/schematics scoped package comes with a binary, create-nx-workspace, for running the schematic for generating a new workspace. You can use this to create new Nx workspaces on your local machine. 
To get started with it you need to install it globally. This can be done via npm or yarn.
```
npm install -g @nrwl/schematics
```
or
```
yarn global add @nrwl/schematics
```
This makes the create-nx-workspace binary available at the terminal. 

### Creating an nx workspace:

After having installed @nrwl/schematics globally, from anywhere on your local machine, you can run the following to create a new Nx workspace:

```
create-nx-workspace myworkspacename
```

Libs and apps folders created and node modules installed. 

### Angular-cli to nx workspace:

You can also add Nx capabilities to an existing CLI project by running:
```sh
ng add @nrwl/schematics
```

### Creating an Application: 

[Create App](https://github.com/nrwl/nx-examples/tree/app): creates the first empty application named school with a routing option.

```
ng generate app school --routing
```

This will configure the root NgModule to wire up routing, as well as add a <router-outlet> to the AppComponent template to help get us started.


### Creating a Library: 

[Create Lib](https://github.com/nrwl/nx-examples/tree/lib)
Adding new libs to an Nx Workspace is done by using the AngularCLI generate command, just like adding a new app. 
Nx has a schematic named lib that can be used to add a new Angular module lib to our workspace:

```
ng generate lib ar
```

This library currently exists as an empty module and not added to be used in any other module. 
The library name is registered in .angular-cli.json file. If you need to delete it for any reason, remember to remove it from the .angular-cli.json apps list as well.


[Create Lib with Routing](https://github.com/nrwl/nx-examples/tree/ui-lib): generates a library with routing and adds the routes to the app module.

We can create an Angular module lib with routing:

```
ng generate lib school-ui --routing
```

We can create an Angular module lib with routing and have it added as a child to routing in one of our apps:
```
ng generate lib school-ui --routing --parentModule=apps/school/src/app/app.module.ts
```

[Create Lib lazy loaded]((https://github.com/nrwl/nx-examples/tree/lib-lazy-module)

And we can create an Angular module lib with routing that we want to have lazy loaded:

```
ng generate lib slides --routing --lazy --parentModule=apps/school/src/app/app.module.ts
```
We just created a new library with a module and added it as a route to the main school application. 
```
 RouterModule.forRoot(
      [
        ...,
        { path: 'slides', loadChildren: '@nx-examples/slides#SlidesModule' }
      ]
```

### Creating Libraries with Tags: 

A large workspace contains a lot of apps and libs. Because it is so easy to share code, create new libs and depend on libs, the dependencies between the apps and libs can quickly get out of hand.

We need a way to impose constraints on the dependency graph.

When creating an app or a lib, you can tag them:

```
ng g lib apilib --tags=api
ng g lib utilslib --tags=utils
ng g lib impllib --tags=impl
ng g lib untagged
```

(you can also pass multiple tags ng g lib apilib --tags=one,two or modify .angular-cli.json)

You can then define a constraint in tslint.json, like this:

```
{
 ...
 "nx-enforce-module-boundaries": [
      true,
      {
        "allow": [],
        "depConstraints": [
          { "sourceTag": "utils", "onlyDependOnLibsWithTags": ["utils"] },
          { "sourceTag": "api", "onlyDependOnLibsWithTags": ["api", "utils"] },
          { "sourceTag": "impl", "onlyDependOnLibsWithTags": ["api", "utils", "impl"] },
        ]
      }
    ]
}
```
With this configuration in place:

  * utilslib cannot depend on apilib or impllib
  * apilib can depend on utilslib
  * implib can depend on both utilslib and apilib
  * untagged lib cannot depend on anything
  * You can also use wildcards, like this:

```
{ "sourceTag": "impl", "onlyDependOnLibsWithTags": ["*"] } // impl can depend on anything
```

```
{ "sourceTag": "*", "onlyDependOnLibsWithTags": ["*"] } // anything can depend on anything
```
The system goes through the constrains until it finds the first one matching the source file it's analyzing.

If we change the configuration to the following:

```
 "nx-enforce-module-boundaries": [
      true,
      {
        "allow": [],
        "depConstraints": [
          { "sourceTag": "utils", "onlyDependOnLibsWithTags": ["utils"] },
          { "sourceTag": "api", "onlyDependOnLibsWithTags": ["api", "utils"] },
          { "sourceTag": "impl", "onlyDependOnLibsWithTags": ["api", "utils", "impl"] },
          { "sourceTag": "*", "onlyDependOnLibsWithTags": ["*"] },
        ]
      }
    ]
 ```
 
 the following will be true:
 
  * utilslib cannot depend on apilib or impllib
  * apilib can depend on utilslib
  * implib can depend on both utilslib and apilib
  * untagged lib can depend on anything
  
### Creating Components:

To generate a component/directive/service/module... in a specific app or library you can use --app:

```sh
ng generate component toolbar --app=shared-ui
```

To generate a new module in shared-ui library and add components to the module:

```sh
ng generate lib shared-ui
ng generate module toolbar --app=shared-ui
ng generate component toolbar/profile --app=shared-ui
```

After running these commands, you will have a new library called shared-ui, a toolbar folder with toolbar.module.ts file.
Profile component folder will be created under shared-ui/src/toolbar/profile directory and included in toolbar.module declarations.

Note that if you want to use profile directive in an app, you need to also add ProfileComponent to exports list on toolbar.module.ts


### Ngrx Store Generation: 

[Ngrx](https://github.com/nrwl/nx-examples/tree/ngrx): 
# ngrx
--------

## Overview

Generates a ngrx feature set containing an `init`, `interfaces`, `actions`, `reducer` and `effects` files. 

You use this schematic to build out a new ngrx feature area that provides a new piece of state.

## Command

```sh
ng generate ngrx FeatureName [options]
```

##### OR

```sh
ng generate f FeatureName [options]
```

### Options

Specifies the name of the ngrx feature (e.g., Products, User, etc.)

- `name`
  - Type: `string`
  - Required: true

Path to Angular Module. Also used to determine the parent directory for the new **+state** 
directory; unless the `--directory` option is used to override the dir name.

>  e.g. --module=apps/myapp/src/app/app.module.ts

- `--module`
  - Type: `string`
  - Required: true

Specifies the directory name used to nest the **ngrx** files within a folder.

- `--directory`
  - Type: `string`
  - Default: `+state`

#### Examples

Generate a `User` feature set and register it within an `Angular Module`.

```sh
ng generate ngrx User -m apps/myapp/src/app/app.module.ts
ng g ngrx Products -m libs/mylib/src/mylib.module.ts
```


Generate a `User` feature set within a `user` folder and register it with the `user.module.ts` file in the same `user` folder.

```sh
ng g ngrx User -m apps/myapp/src/app/app.module.ts -directory user
```

## Generated Files

The files generated are shown below and include placeholders for the *feature* name specified.

> The &lt;Feature&gt; notation used below indicates a placeholder for the actual *feature* name.

*  [&lt;feature&gt;.actions.ts](#featureactionsts)
*  [&lt;feature&gt;.reducer.ts](#featurereducerts)
*  [&lt;feature&gt;.effects.ts](#featureeffectsts)
*  [&lt;feature&gt;.selectors.ts](#featureselectorsts)
*  [&lt;feature&gt;.facade.ts](#featurefacadests)

*  [../app.module.ts](#appmodulets)
  
#### &lt;feature&gt;.actions.ts
  
```ts
import {Action} from "@ngrx/store";

export enum <Feature>ActionTypes {
 <Feature>       = "[<Feature>] Action",
 Load<Feature>   = "[<Feature>] Load Data",
 <Feature>Loaded = "[<Feature>] Data Loaded"
}

export class <Feature> implements Action {
 readonly type = <Feature>ActionTypes.<Feature>;
}

export class Load<Feature> implements Action {
 readonly type = <Feature>ActionTypes.Load<Feature>;
 constructor(public payload: any) { }
}

export class DataLoaded implements Action {
 readonly type = <Feature>ActionTypes.<Feature>Loaded;
 constructor(public payload: any) { }
}

export type <Feature>Actions = <Feature> | Load<Feature> | <Feature>Loaded;
```

#### &lt;feature&gt;.reducer.ts
```ts
import { <Feature> } from './<feature>.interfaces';
import { <Feature>Action, <Feature>ActionTypes } from './<feature>.actions';

/**
 * Interface for the '<Feature>' data used in
 *  - <Feature>State, and
 *  - <feature>Reducer
 */
export interface <Feature>Data {

}

/**
 * Interface to the part of the Store containing <Feature>State
 * and other information related to <Feature>Data.
 */
export interface <Feature>State {
  readonly <feature>: <Feature>Data;
}

export const initialState: <Feature>Data = {  };

export function <feature>Reducer(state: <Feature>Data = initialState, action: <Feature>Actions): <Feature>Data {
 switch (action.type) {
   case <Feature>ActionTypes.<Feature>Loaded: {
     return { ...state, ...action.payload };
   }
   default: {
     return state;
   }
 }
}
```

#### &lt;feature&gt;.effects.ts
```ts
import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { DataPersistence } from '@nrwl/nx';

import { <Feature> } from './<feature>.interfaces';
import { Load<Feature>, <Feature>Loaded, <Feature>ActionTypes } from './<feature>.actions';

@Injectable()
export class <Feature>Effects {
 @Effect() load<Feature>$ = this.dataPersistence.fetch(<Feature>ActionTypes.Load<Feature>, {
   run: (action: Load<Feature>, state: <Feature>) => {
     return new <Feature>Loaded({});
   },

   onError: (action: Load<Feature>, error) => {
     console.error('Error', error);
   }
 });

 constructor(
   private actions: Actions, 
   private dataPersistence: DataPersistence<Feature>) { }
}
```


#### ../app.module.ts
```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import {
  <feature>Reducer,
  <Feature>State,
  <Feature>Data,
  initialState as <feature>InitialState
} from './+state/<Feature>.reducer';
import { <Feature>Effects } from './+state/<Feature>.effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { storeFreeze } from 'ngrx-store-freeze';

@NgModule({
  imports: [BrowserModule, RouterModule.forRoot([]),
    StoreModule.forRoot({ <feature>: <feature>Reducer }, {
      initialState: { <feature>: <feature>InitialState },
      metaReducers: !environment.production ? [storeFreeze] : []
    }),
    EffectsModule.forRoot([<Feature>Effects]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    StoreRouterConnectingModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [<Feature>Effects]
})
export class AppModule {
}

```

# Updating Nx:

[Nx Update](https://github.com/nrwl/nx-examples/tree/nx-migrate): 

You can check for the updates (nx version > 0.8.0).

```
yarn update:check
```

You can migrate to the newest nx-module by updating nx on package.json and running yarn update.

```
yarn update
```

## Nrwl Extensions for Angular (Nx)

<a href="https://nrwl.io/nx"><img src="https://preview.ibb.co/mW6sdw/nx_logo.png"></a>

Nx is an open source toolkit for enterprise Angular applications.

Nx is designed to help you create and build enterprise-grade Angular applications. It provides an opinionated approach to application project structure and patterns.

## Quick Start & Documentation

[Watch a 5-minute video on how to get started with Nx.](http://nrwl.io/nx)

### Development server: 

Run `ng serve --app=myapp` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name --app=myapp` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build --app=myapp` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

To build only the changed files since the last build run:

```bash
npm run affected:build -- SHA1 SHA2
//OR
npm run affected:build -- --files="libs/mylib/index.ts,libs/mylib2/index.ts"
```

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Affected Apps

```bash
npm run affected:apps -- SHA1 SHA2
npm run affected: builds -- SHA1 SHA2
npm run affected:e2e -- SHA1 SHA2
npm run format:write -- SHA1 SHA2 --libs-and-apps
npm run format:check -- SHA1 SHA2 --libs-and-apps
```

OR

```bash
yarn affected:apps -- SHA1 SHA2
yarn affected: builds -- SHA1 SHA2
yarn affected:e2e -- SHA1 SHA2
```



The apps:affected prints the apps that are affected by the commits between the given SHAs. The build:affected builds them, and e2e:affected runs their e2e tests.

To be able to do that, Nx analyzes your monorepo to figure out the dependency graph or your libs and apps. Next, it looks at the files touched by the commits to figure out what apps and libs they belong to. Finally, it uses all this information to generate the list of apps that can be affected by the commits.

Instead of passing the two SHAs, you can also pass the list of files, like this:

```bash
npm run affected:apps -- --files="libs/mylib/index.ts,libs/mylib2/index.ts"
npm run affected:builds ----files="libs/mylib/index.ts,libs/mylib2/index.ts"
npm run affected:e2e ----files="libs/mylib/index.ts,libs/mylib2/index.ts"
npm run format:write -- --files="libs/mylib/index.ts,libs/mylib2/index.ts"
npm run format:check -- --files="libs/mylib/index.ts,libs/mylib2/index.ts"
```



## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
