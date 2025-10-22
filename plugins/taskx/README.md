# Taskx

Experimental hierarchical task engine

- Not to be published or distributed, tailored to local dev laptop file hierarchy
- Run rushx build && rushx copy to test in dev vault

## Usage

In a dataviewjs block, run:

```js
const taskx = app.plugins.plugins["obsidian-taskx"];
taskx.dv = dv;
taskx.doThis();
taskx.doThat();
```
