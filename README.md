# basejs

## Setting values to storage

```javascript
base.set("path::name", "value");

base.set("foo.bar.buzz::token", "i am the string!");

base.set("application.meta.info::author", {
  name : "Alex",
  email : "a.gvrnsk@gmail.com",
  linkedin : "www.linkedin.com/in/sanyabeast"
});

base.set("res.l18n.current::header-caption", "I am header");
```

## Subscribing for events
### change

```javascript
base.on("res.l18n.current::header-caption", "change", function(value){
  document.querySelector("#app-header").innerText = value;
});
```

## Getting values from storage

```javascript
base.get("path::name");
//"value"
 
base.get("foo.bar.buzz::token");
//"I am the string";
```

## Iterating folder

```javascript
//Setting values
base.set("folder.subfolder::one", 1);
base.set("folder.subfolder::two", 2);
base.set("folder.subfolder::three", 3);

//Iterating
base.forEach("folder.subfolder", function(value){
  console.log(value);
});
//1, 2, 3
```

## Helpers
### flat view

```javascript
console.log(base.flat)
/* {
  path::name : (...),
  foo.bar.buzz::token :(...),
  application.meta.info::author : (...),
  res.l18n.current::header-caption : (...),
  folder.subfolder::one : (...),
  folder.subfolder::one : (...),
  folder.subfolder::one : (...)
}*/
```

### reach object property

```javascript
base.reach({ foo : { bar : { buzz : { hello : "Hello!" } } } }, "foo.bar.buzz.hello");
//Hello
base.reach({ foo : { bar : { buzz : { hello : "Hello!" } } } }, "foo.bar.buzz.goodbye");
//null
```
