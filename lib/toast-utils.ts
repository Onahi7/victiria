import { toast } from "@/hooks/use-toast"

export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
  })
}

export const showErrorToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "destructive",
  })
}

export const showLoadingToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
  })
}

// Common toast messages
export const commonToasts = {
  success: {
    bookAdded: {
      title: "Book added to library!",
      description: "The book has been successfully added to your library.",
    },
    bookRemoved: {
      title: "Book removed",
      description: "The book has been removed from your library.",
    },
    wishlistAdded: {
      title: "Added to wishlist!",
      description: "The book has been added to your wishlist.",
    },
    wishlistRemoved: {
      title: "Removed from wishlist",
      description: "The book has been removed from your wishlist.",
    },
    profileUpdated: {
      title: "Profile updated!",
      description: "Your profile has been successfully updated.",
    },
    passwordChanged: {
      title: "Password changed!",
      description: "Your password has been successfully changed.",
    },
    orderPlaced: {
      title: "Order placed successfully!",
      description: "Your order has been placed and is being processed.",
    },
    paymentSuccessful: {
      title: "Payment successful!",
      description: "Your payment has been processed successfully.",
    },
    reviewSubmitted: {
      title: "Review submitted!",
      description: "Thank you for your feedback. Your review has been submitted.",
    },
    subscriptionActivated: {
      title: "Subscription activated!",
      description: "Your subscription has been successfully activated.",
    },
  },
  error: {
    generic: {
      title: "Something went wrong",
      description: "An unexpected error occurred. Please try again.",
    },
    networkError: {
      title: "Network error",
      description: "Please check your internet connection and try again.",
    },
    unauthorized: {
      title: "Access denied",
      description: "You are not authorized to perform this action.",
    },
    validation: {
      title: "Validation error",
      description: "Please check your input and try again.",
    },
    paymentFailed: {
      title: "Payment failed",
      description: "Your payment could not be processed. Please try again.",
    },
    serverError: {
      title: "Server error",
      description: "The server is experiencing issues. Please try again later.",
    },
  },
  loading: {
    processing: {
      title: "Processing...",
      description: "Please wait while we process your request.",
    },
    uploading: {
      title: "Uploading...",
      description: "Please wait while we upload your file.",
    },
    saving: {
      title: "Saving...",
      description: "Please wait while we save your changes.",
    },
  },
}

// Helper function to show toast based on API response
export const handleApiResponse = (response: any, successMessage?: { title: string; description?: string }) => {
  if (response.ok || response.success) {
    showSuccessToast(
      successMessage?.title || "Success!",
      successMessage?.description || "Operation completed successfully."
    )
  } else {
    const errorMessage = response.error || response.message || "An unexpected error occurred."
    showErrorToast("Error", errorMessage)
  }
}

// Helper function for form submission feedback
export const handleFormSubmission = async (
  submitFunction: () => Promise<any>,
  successMessage?: { title: string; description?: string },
  errorMessage?: { title: string; description?: string }
) => {
  try {
    const response = await submitFunction()
    
    if (response.ok || response.success) {
      showSuccessToast(
        successMessage?.title || "Success!",
        successMessage?.description || "Form submitted successfully."
      )
      return { success: true, data: response }
    } else {
      const error = response.error || response.message || "An unexpected error occurred."
      showErrorToast(
        errorMessage?.title || "Error",
        errorMessage?.description || error
      )
      return { success: false, error }
    }
  } catch (error) {
    showErrorToast(
      errorMessage?.title || "Error",
      errorMessage?.description || "An unexpected error occurred."
    )
    return { success: false, error }
  }
}
