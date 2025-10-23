import {inject} from '@loopback/core';
import {
  RequestContext,
  SequenceHandler,
  RestBindings,
} from '@loopback/rest';
import {authMiddleware} from './middleware/auth.middleware';

export class MySequence implements SequenceHandler {
  constructor(
    @inject(RestBindings.SequenceActions.FIND_ROUTE) protected findRoute: Function,
    @inject(RestBindings.SequenceActions.PARSE_PARAMS) protected parseParams: Function,
    @inject(RestBindings.SequenceActions.INVOKE_METHOD) protected invoke: Function,
    @inject(RestBindings.SequenceActions.SEND) public send: Function,
    @inject(RestBindings.SequenceActions.REJECT) public reject: Function,
  ) {}

  async handle(context: RequestContext) {
    const {request, response} = context;

    try {
      // Run JWT middleware
      await authMiddleware(context, async () => {});

      // Find the matching controller method
      const route = this.findRoute(request);
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (err) {
      this.reject(context, err);
    }
  }
}
