# Environment Setup Guide

## Security Best Practices

**⚠️ IMPORTANT: Never commit API keys to GitHub!**

## Setup Instructions

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Add your Anthropic API key:**
   - Sign up at [Anthropic Console](https://console.anthropic.com/)
   - Generate a new API key
   - Add it to your local `.env` file:
     ```bash
     ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
     ```

3. **Update other configuration as needed:**
   - Database URL for your local PostgreSQL
   - JWT secret for your development environment
   - Other API keys as required

## Model Configuration

The system uses a configurable Claude model through the `ANTHROPIC_MODEL` environment variable:

- **Default**: `claude-3-5-sonnet-20241022` (current stable version)
- **Latest**: You can use `claude-3-5-sonnet-latest` for the newest version
- **Custom**: Specify any Anthropic model ID

### Future-Proofing

To avoid breaking changes when Anthropic updates models:

1. **Environment-based**: Set `ANTHROPIC_MODEL` in your `.env` file
2. **Configurable**: Update the default in `src/config/environment.ts`
3. **Fallback**: The system defaults to a known stable version

## File Security

- ✅ `.env` is in `.gitignore` - local configs won't be committed
- ✅ `.env.example` provides a template without secrets
- ✅ Configuration is validated at startup
- ✅ API keys are loaded from environment variables only

## Production Deployment

For production:

1. **Use environment variables or secret management**:
   ```bash
   export ANTHROPIC_API_KEY="your-production-key"
   export ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
   ```

2. **Never include secrets in Docker images or config files**

3. **Use different API keys for different environments**

## Testing Without API Keys

Some features will gracefully degrade without API keys:

- Document parsing will show helpful error messages
- Guided conversations will still work
- Basic functionality remains available

## Troubleshooting

### "LLM service unavailable" errors:
1. Check your `.env` file has `ANTHROPIC_API_KEY` set
2. Verify the API key is valid
3. Check the `ANTHROPIC_MODEL` is supported

### Model not found errors:
1. Update `ANTHROPIC_MODEL` to a current version
2. Check [Anthropic's documentation](https://docs.anthropic.com/en/docs/models-overview) for available models
3. Use `claude-3-5-sonnet-latest` for the newest version