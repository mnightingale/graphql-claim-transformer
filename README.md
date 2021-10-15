# graphql-claim-transformer

Populate fields from identity claims.

## Installation

`npm install --save graphql-claim-transformer`

## How to use

### Setup custom transformer

Edit `amplify/backend/api/<YOUR_API>/transform.conf.json` and append `"graphql-claim-transformer"` to the `transformers` field.

```json
"transformers": [
    "graphql-claim-transformer"
]
```

### Use @claim directive

Append `@claim` to target fields.

```graphql
type Todo @model {
  id: ID!
  title: String!
  description: String
  foo: String @claim(name: "bar")
}
```

In the above example the create and update mutations will set the `foo` field to the value of the `bar` claim on the user identity object (`$ctx.identity.claims.get("bar")`).
