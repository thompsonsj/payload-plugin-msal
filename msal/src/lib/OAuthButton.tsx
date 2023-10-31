import Button from 'payload/dist/admin/components/elements/Button'
import React from 'react'

export default function OAuthButton() {
  return (
    <div style={{ marginBottom: 40 }}>
      <Button el="anchor" url="/msal/authorize">
        Sign in with Microsoft 365
      </Button>
    </div>
  )
}
