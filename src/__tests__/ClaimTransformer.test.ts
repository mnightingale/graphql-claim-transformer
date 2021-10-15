// @ts-ignore
import { AppSyncTransformer } from 'graphql-appsync-transformer'
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer'
import { GraphQLTransform } from 'graphql-transformer-core'
import ClaimTransformer from '../index'

const featureFlags = {
  getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
    if (name === 'improvePluralization') {
      return true
    }
    return
  }),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
}

const transformer = new GraphQLTransform({
  featureFlags,
  transformers: [
    new AppSyncTransformer(),
    new DynamoDBModelTransformer(),
    new ClaimTransformer(),
  ],
})

test('@claim directive can be used on fields', () => {
  const schema = `
    type Todo @model {
      id: ID!
      claim: String @claim(name: "foobar")
    }
  `
  expect(() => transformer.transform(schema)).not.toThrow()
})

test('@claim directive can not be used on types', () => {
  const schema = `
    type Todo @model @claim {
      id: ID!
    }
  `
  expect(() => transformer.transform(schema)).toThrowError(
    'Directive "claim" may not be used on OBJECT.',
  )
})

test('@claim directive can not be used on fields other than String and Int', () => {
  const schema = `
    type Todo @model {
      id: ID!
      claim: AWSDateTime @claim(name: "foobar")
    }
  `
  expect(() => transformer.transform(schema)).toThrowError(
    'Directive "claim" must be used only on String or Int type fields.',
  )
})

test('@claim directive can be used on fields with String type', () => {
  const schema = `
    type Todo @model {
      id: ID!
      claim: String @claim(name: "foobar")
    }
  `
  expect(() => transformer.transform(schema)).not.toThrow()
})

test('@claim directive can be used on fields with Int type', () => {
  const schema = `
    type Todo @model {
      id: ID!
      claim: Int @claim(name: "foobar")
    }
  `
  expect(() => transformer.transform(schema)).not.toThrow()
})

test('@claim generates valid resovler code', () => {
  const schema = `
    type Todo @model {
      id: ID!
      foo: String @claim(name: "bar")
    }
  `
  const out = transformer.transform(schema)
  expect(out).toBeDefined()
  expect(out.resolvers).toMatchSnapshot()
})
