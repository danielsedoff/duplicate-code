# dupe-code

Find duplicate code in your JavaScript/TypeScript-based project 

- inspects your js, ts, jsx, tsx code
- generates a log
- puts it into the `/logs` directory of your project.

Install:

`npm i dupe-code`

Add it as a script to your `package.json` file:

```
...
scripts: {
  "dupes": "node node_modules/dupe-code/dupe-code.js"
}
```

Run:

`npm run dupes`

Now you get a log in your `/logs` directory.
