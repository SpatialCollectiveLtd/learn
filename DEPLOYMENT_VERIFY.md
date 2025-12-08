# Deployment Verification

Last deployment: December 8, 2025
Build trigger: Force rebuild to ensure latest validation is deployed

## Latest Changes
- New staff ID format: S[T/F/M]EA####[SA/T/A]
- Old SC### format should be rejected
- Validation regex: /^S[TFM]EA\d{4}(SA|T|A)$/i

## Verification
After deployment, test:
- ❌ SC001 should be REJECTED
- ❌ SC002 should be REJECTED  
- ✅ STEA8103SA should work
- ✅ SFEA0119T should work
- ✅ SMEA4441A should work
