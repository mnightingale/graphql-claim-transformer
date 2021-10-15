import {
  ArgumentNode,
  DirectiveNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  valueFromASTUntyped,
} from 'graphql'
import { iff, not, printBlock, qref, raw } from 'graphql-mapping-template'
import { getBaseType, ResolverResourceIDs } from 'graphql-transformer-common'
import {
  gql,
  InvalidDirectiveError,
  Transformer,
  TransformerContext,
} from 'graphql-transformer-core'

export class ClaimTransformer extends Transformer {
  constructor() {
    super(
      'ClaimTransformer',
      gql`
        directive @claim(name: String!) on FIELD_DEFINITION
      `,
    )
  }

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    acc: TransformerContext,
  ): void => {
    if (!['String', 'Int'].includes(getBaseType(definition.type))) {
      throw new InvalidDirectiveError(
        'Directive "claim" must be used only on String or Int type fields.',
      )
    }

    const isArg = (s: string) => (arg: ArgumentNode) => arg.name.value === s
    const getArg = (arg: string, dflt?: any) => {
      const argument = directive.arguments!.find(isArg(arg))
      return argument ? valueFromASTUntyped(argument.value) : dflt
    }

    const claim = getArg('name')
    const field = definition.name.value
    const typeName = parent.name.value

    this.augmentMutation(
      acc,
      ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName),
      field,
      claim,
    )
    this.augmentMutation(
      acc,
      ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName),
      field,
      claim,
    )
  }

  private augmentMutation(
    ctx: TransformerContext,
    mutationResolverLogicalId: string,
    field: string,
    claim: string,
  ) {
    const snippet = printBlock(`Setting "${field}" to claim "${claim}"`)(
      iff(
        not(raw(`$util.isNullOrEmpty($ctx.identity.claims.get("${claim}"))`)),
        qref(
          `$ctx.args.input.put("${field}", "$ctx.identity.claims.get("${claim}")")`,
        ),
      ),
    )
    const resolver = ctx.getResource(mutationResolverLogicalId)
    if (resolver) {
      resolver.Properties!.RequestMappingTemplate =
        snippet + '\n\n' + resolver.Properties!.RequestMappingTemplate
      ctx.setResource(mutationResolverLogicalId, resolver)
    }
  }
}
