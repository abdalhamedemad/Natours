## Learning Express

## res object

- we can send back message using res.send("hello")
- to send back Json use -> res.status.json({}) // here we don not need to define the content type in the res body express make this for us
- to add the status code use -> res.status(200).json({})

## parsing Json into JS

## Route handler is the callback function for each request

### handle get

```js
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    // when multiple result if one we don"t need to specify it
    results: tours.length,
    data: {
      tours,
    },
  });
});
```

### handle post request

```js
// this a middleware for adding the body to the request
// without it when we try to use req.bod will give undefined
app.use(express.json());

app.post('/api/v1/tours', (req, res) => {
  console.log(req.body);
  /// create object
  // here we do not needs to specify results bec it is one element
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
  res.send('Done');
});
```

### URl params , params that has variable

```js
app.get('/api/v1/tours/:id/:x/:y?', (req, res) => {
  // will log an object contains all params
  // if params needs to be optional add ? ex-> ":y?"
  console.log(req.params);
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});
```

## handle patch

```js
app.patch('/api/v1/tours/:id', (req, res) => {
  // in patch we just send the needed element that we want to change not the whole object
  // update the element
  // send res
  res.status(200).json({
    status: 'success',
    data: {
      tours: newTour,
    },
  });
});
```

## handle delete

```js
app.delete('/api/v1/tours/:id', (req, res) => {
  // delete element
  //----
  // res
  // 204 no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
```

## if we have same route but have different http methods use

- use app.route('/api/v1/tours').get(getFunc).post(postFunc)....

```js
app.route('/api/v1/tours/').get(getAllTours).post(createTour);
```

## middle ware

- middleware are called in the order they defined in the code when a request occurs
- exap

```js
app.route('/r1');
app.use((req, res, next));
app.route('/r2');
// here this middleware only executed in the request at route /r2
```

```js
// this a middle ware that will execute for every/any request bec we do not
// specify a route and before any of the routes
app.use((req, res, next) => {
  console.log('hello from middleware');
  // if we do not call the next method req will stuck here
  next();
});
//  this middleware add a new property to the request object
app.use((req: CustomRequest, res: Response, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
```

## morgan 3rd party library middleware

- help for loggers , for each request will print some of the information in the terminal

## router params

- this router params use for making a middleware that is executing when the required params found in the url

```js
// this middleware will executed when the id found in the url
// and val is the value of the id params
// api/tours/2    val will be 2 and will executed the callback
// api/tours      will not execute the call back
router.param('id', (req, res, next, val) => {
  console.log(id);
  next();
});
```

- we use this in order to check if the params found and valid

## chaining middle ware

- we can add more than middleware and chaining them
- like the follow ex here we first check for body data if valid move to the next middleware

```js
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.checkBody, tourController.createTour);
```

## Serving static files

- to serve static files use app.use(express.static(`[specify the directory]`))

## Eslint- prettier config

- install eslint + prettier in vs code
- run this shell comand >> npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev
- will differ for node with Type script

## Query parameter /tours?name=mm&price=10

- to get the query params in express use req.query will return an object with all query params
- we can add more options in the query params like if we want price greater than 5 so to write it in the standered way -? /tours?duration[gte]=5&.. and this will be converted with express to {duration:{gte:'5'}} so the only missing thing that we want to works fine in mongoos is that replace gte with $gte

- Sorting Asc default ->/tours?sort=price for Desc order use /tours?sort=-price

## To make alising use middle ware look at aliasTopTours

## Virtual properties in mongoose

- fields that can be defined in the schema but can not persisted i.e did not save into the database i.e derived fields that can calculate from one filed to another like if data save in Kilo meters we cannot make a field to save a meters so virtual properties helps in this cases to save some space look at tourSchema durationWeeks

## Slugify

- A slug is a human-readable identifier used in a URL instead of a database ID.
- ex instead of /tours/6edf5fg45b4g8d4fbg8df4b be /tours/name-of-the-tour
- It is usually generated from a title or name.
- Written in lowercase.
- Spaces become hyphens -.
- Special characters are removed.

## Mongo Middleware there are 3 types Document and

### Document middleware has many properties this for .save() and .create() and not For insertMany and Find by Id

- pre('save',callback func) this middleware will be executed before saving to the DB occurs
  -post() after saved to the db

### Query Middleware this for Queries like Find id and not findById

- pre('find', callback func)
- this will point to the current query not the document

## Data validation

- check if all the values follows the required schema
- here will use a validator package and some vaildator in mongoose

## sanitization

- check if any mallicious code injected the data

## Debugger

- in node js we can debug using a node debuger from google called ndb as dev dependencies

## For password encryption will use bcryptjs package

## for JWt will use pkg jsonwebtoken

- JWT_SECRET must be at least 32 chars

## Convert from callback to promises

- use promisify from {promisify} from 'util'
- here pass to promisify the function then call it
- await promisify(jwt.verify)(token , process.env.JWT_SECRET)

## we will use nodemailer library to send email to reset the password

## Security

### JWT with Cookies

- send the jwt token with cookies so the browser will save it in secure way
- instead of saving it to the localstorage which is less secure any one can use it (stole it)
- a Cookie is a piece of text the server sends to the browser and the broswer sends it back with each request

### will add a rate limiting pkg for security rate limiting to determine the number of the request that comes from the same ip to prevent DOS Attack and brute force attack

### helmet : is a security okg that allows to add headers to make the app more secure, browser will understand this headers for security

### No Sql injection make a Data sanitization use express-mongo-sanitize and XSS

## will use multer for image uploading

## For image resizing will use sharp library
