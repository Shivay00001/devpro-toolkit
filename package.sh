#!/bin/bash
# Package the extension into devpro-toolkit.zip
set -e
cd "$(dirname "$0")"
zip -r devpro-toolkit.zip manifest.json icons background content lib modules options popup blocked \
  -x '*.git*' '*__MACOSX*' 2>/dev/null
echo "Created devpro-toolkit.zip"
