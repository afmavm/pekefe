#!/bin/bash
# PEKEFE Safe Isolated Production Auto-Deploy Script
# Delegates directly to deploy_github.sh to protect sibling projects on the same server.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1
bash "$SCRIPT_DIR/deploy_github.sh"
