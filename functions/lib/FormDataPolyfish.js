export function* parseMimeMultipart(/** @type {Uint8Array} */ uint8Array) {
  const textDecoder = new TextDecoder();
  let state = {type: 'boundary', boundary: ''};
  let index = 0;
  let line = 0;
  let column = 0;
  for (; index < uint8Array.byteLength; index++) {
    const character = textDecoder.decode(uint8Array.slice(index, index + 1));
    if (character === '\n') {
      line++;
      column = 0;
    }

    column++;

    switch (state.type) {
      case 'boundary': {
        // Check Windows newlines
        if (character === '\r') {
          if (textDecoder.decode(uint8Array.slice(index + 1, index + 2)) !== '\n') {
            throw new Error(`At ${index} (${line}:${column}): found an incomplete Windows newline.`);
          }

          break;
        }

        if (character === '\n') {
          state = {type: 'header-name', boundary: state.boundary, name: '', value: '', headers: []};
          break;
        }

        state.boundary += character;
        break;
      }
      case 'header-name': {
        // Check Windows newlines
        if (character === '\r') {
          if (textDecoder.decode(uint8Array.slice(index + 1, index + 2)) !== '\n') {
            throw new Error(`At ${index} (${line}:${column}): found an incomplete Windows newline.`);
          }

          break;
        }

        if (character === '\n') {
          if (state.name === '') {
            state = {type: 'content', boundary: state.boundary, headers: state.headers, index: index + 1, length: 0};
            break;
          } else {
            throw new Error(`At ${index} (${line}:${column}): a newline in a header name '${state.name}' is not allowed.`);
          }
        }

        if (character === ':') {
          state = {
            type: 'header-value',
            boundary: state.boundary,
            name: state.name,
            value: '',
            values: [],
            headers: state.headers
          };
          break;
        }

        state.name += character;
        break;
      }
      case 'header-value': {
        // Check Windows newlines
        if (character === '\r') {
          if (textDecoder.decode(uint8Array.slice(index + 1, index + 2)) !== '\n') {
            throw new Error(`At ${index} (${line}:${column}): found an incomplete Windows newline.`);
          }

          break;
        }

        if (character === ';') {
          state.values.push(state.value);
          state.value = '';
          break;
        }

        if (character === ' ') {
          // Ignore white-space prior to the value content
          if (state.value === '') {
            break;
          }
        }

        if (character === '\n') {
          state.values.push(state.value);
          state = {
            type: 'header-name',
            boundary: state.boundary,
            name: '',
            value: '',
            headers: [{name: state.name, values: state.values}, ...state.headers]
          };
          break;
        }

        state.value += character;
        break;
      }
      case 'content': {
        // If the newline is followed by the boundary, then the content ends
        if (character === '\n' || character === '\r' && textDecoder.decode(uint8Array.slice(index + 1, index + 2)) === '\n') {
          if (character === '\r') {
            index++;
          }

          const boundaryCheck = textDecoder.decode(uint8Array.slice(index + '\n'.length, index + '\n'.length + state.boundary.length));
          if (boundaryCheck === state.boundary) {
            const conclusionCheck = textDecoder.decode(uint8Array.slice(index + '\n'.length + state.boundary.length, index + '\n'.length + state.boundary.length + '--'.length));
            if (conclusionCheck === '--') {
              index += '\n'.length + state.boundary.length + '--'.length;
              yield {headers: state.headers, index: state.index, length: state.length};

              if (index !== uint8Array.byteLength) {
                const excess = uint8Array.slice(index);
                if (textDecoder.decode(excess) === '\n' || textDecoder.decode(excess) === '\r\n') {
                  return;
                }

                throw new Error(`At ${index} (${line}:${column}): content is present past the expected end of data ${uint8Array.byteLength}.`);
              }

              return;
            } else {
              yield {headers: state.headers, index: state.index, length: state.length};
              state = {type: 'boundary', boundary: ''};
              break;
            }
          }
        }

        state.length++;
        break;
      }
      default: {
        throw new Error(`At ${index} (${line}:${column}): invalid state ${JSON.stringify(state)}.`);
      }
    }
  }

  if (state.type !== 'content') {
    throw new Error(`At ${index} (${line}:${column}): expected content state, got ${JSON.stringify(state)}.`);
  }
}

export async function FormDataPolyfish(request) {
  const uint8Array = await request.arrayBuffer();
  const result = {};
  const textDecoder = new TextDecoder("utf-8");
  for (let part of parseMimeMultipart(uint8Array)) {
    const key = part.headers[part.headers.length - 1].values[1].split("=")[1].slice(1, -1);
    const body = uint8Array.slice(part.index, part.length + part.index);
    if (part.headers.length === 1) {
      result[key] = textDecoder.decode(body);
    } else {
      const headers = {};
      for (let head of part.headers.slice(0, -1))
        headers[head.name] = head.values.join(";");
      result[key] = {headers, body};
    }
  }
  return result;
}