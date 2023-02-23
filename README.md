# Typesafe REST API Specification - Zod Extras Libraries

[![CI Pipeline](https://github.com/ty-ras/extras-zod/actions/workflows/ci.yml/badge.svg)](https://github.com/ty-ras/extras-zod/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/ty-ras/extras-zod/actions/workflows/cd.yml/badge.svg)](https://github.com/ty-ras/extras-zod/actions/workflows/cd.yml)

The Typesafe REST API Specification is a family of libraries used to enable seamless development of Backend and/or Frontend which communicate via HTTP protocol.
The protocol specification is checked both at compile-time and run-time to verify that communication indeed adhers to the protocol.
This all is done in such way that it does not make development tedious or boring, but instead robust and fun!

This particular repository contains generic libraries related to using [`zod`](https://github.com/colinhacks/zod):
- [typed-sql](./typed-sql) contains library which enables type-safe SQL query string specification and execution with a help of [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates).
- [config](./config) contains library which encapsulates common logic related to reading JSON-encoded configuration values from e.g. environment variables.
- [state](./state) contains library for handling state in TyRAS backend in most intuitive way: state passed to endpoint handlers being object, and endpoint handlers specifying which state properties they need via array of strings.
