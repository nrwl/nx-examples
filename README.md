# NxExamples

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) using [Nrwl Nx](https://nrwl.io/nx).

[Install](https://github.com/nrwl/nx-examples/tree/workspace): project workspace after the first installation script is run.
This is the step after running the install script. 

```
curl -fsSL https://raw.githubusercontent.com/nrwl/nx/master/packages/install/install.sh | bash -s myprojectname
```

Libs and apps folders created and node modules installed. 

[Create App](https://github.com/nrwl/nx-examples/tree/app): creates the first empty application named school with routing option.

```
ng generate app school --routing
```

This will configure the root NgModule to wire up routing, as well as add a <router-outlet> to the AppComponent template to help get us started.

[Create Lib](https://github.com/nrwl/nx-examples/tree/lib)
Adding new libs to an Nx Workspace is done by using the AngularCLI generate command, just like adding a new app. 
Nx has a schematic named lib that can be used to add a new Angular module lib to our workspace:

```
ng generate lib ar
```

This library currently exist as an empty module and not added to be used in any other module. 
Library name is registered in .angular-cli.json file. If you need to delete it for any reason, remember to remove it from the .angular-cli.json apps list as well.


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
We just created a new library with module and added as a route to main school application. 
```
 RouterModule.forRoot(
      [
        ...,
        { path: 'slides', loadChildren: '@nx-examples/slides#SlidesModule' }
      ]
```


[Ngrx](https://github.com/nrwl/nx-examples/tree/ngrx): 

We can run the generate command for ngrx with the module and onlyEmptyRoot option to only add the StoreModule.forRoot and EffectsModule.forRoot calls without generating any new files.
This can be useful in the cases where we don't have a need for any state at the root (or app) level.

```
ng generate ngrx app --module=apps/school/src/app/app.module.ts  --onlyEmptyRoot
```

This will set up AppModule imports to include:

```
imports: {
    ...
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    StoreRouterConnectingModule
}
```
[Ngrx for Feature](https://github.com/nrwl/nx-examples/tree/ngrx-feature): 
We might also want to have state related to a particular part of the application or a library. 

```
ng generate ngrx slides --module=libs/slides/src/slides.module.ts
```

[Model Module](https://github.com/nrwl/nx-examples/tree/model): 

You can also have your state on a separate module:

```
ng generate lib model
ng generate ngrx app --module=libs/model/src/model.module.ts
ng generate ngrx app --module=apps/school/src/app/app.module.ts  --onlyEmptyRoot
```

This will create the model module that will have the app state and empty store configuration on the root app. 
We have to manually add state configuration on the main app like so:

```
imports: {
  ...
  StoreModule.forRoot(appReducer, {initialState: appInitialState}),
  ...
}
```

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

Nx is designed to help you create and build enterprise grade Angular applications. It provides an opinionated approach to application project structure and patterns.

## Quick Start & Documentation

[Watch a 5-minute video on how to get started with Nx.](http://nrwl.io/nx)

## Development server

Run `ng serve --app=myapp` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name --app=myapp` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build --app=myapp` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
