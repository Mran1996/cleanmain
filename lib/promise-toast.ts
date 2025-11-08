import { toast } from 'sonner';

interface MotivationalMessage {
  message: string;
  description?: string;
}

const motivationalMessages: Record<string, MotivationalMessage> = {
  '10s': {
    message: '🚀 Getting started...',
    description: 'Analyzing your case details'
  },
  '20s': {
    message: '💪 Building your case...',
    description: 'Crafting compelling arguments'
  },
  '30s': {
    message: '📚 Researching precedents...',
    description: 'Finding relevant case law'
  },
  '1min': {
    message: '✨ Polishing your document...',
    description: 'Ensuring legal accuracy'
  },
  '2min': {
    message: '🎯 Refining arguments...',
    description: 'Strengthening your position'
  },
  '3min': {
    message: '🔍 Final review in progress...',
    description: 'Quality checking every detail'
  },
  '4min': {
    message: '📄 Almost ready...',
    description: 'Putting finishing touches'
  },
  '5min': {
    message: '⚡ Finalizing document...',
    description: 'Preparing for delivery'
  },
  'api-response': {
    message: '⚡ Finalizing document...',
    description: 'Preparing for delivery'
  }
};

// Additional motivational quotes for variety
const motivationalQuotes = [
  "🏛️ Justice takes time, but excellence is worth the wait",
  "⚖️ Every great legal document is crafted with care and precision",
  "📖 Your story matters - we're making sure it's told effectively",
  "🎯 Building a strong foundation for your legal success",
  "💡 Innovation meets tradition in legal excellence",
  "🌟 Transforming complex legal concepts into clear, powerful arguments"
];

export interface PromiseToastOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  enableMotivationalMessages?: boolean;
  motivationalInterval?: number;
}

export function createPromiseToast<T>(
  promise: Promise<T>,
  options: PromiseToastOptions = {}
): Promise<T> {
  const {
    loadingMessage = 'Processing your request...',
    successMessage = 'Success!',
    errorMessage = 'Something went wrong',
    enableMotivationalMessages = true,
    motivationalInterval = 10000 // 10 seconds
  } = options;

  let motivationalTimer: NodeJS.Timeout | null = null;
  let currentMessageIndex = 0;
  const startTime = Date.now();

  const messageIntervals = [
    { time: 10000, key: '10s' },
    { time: 20000, key: '20s' },
    { time: 30000, key: '30s' },
    { time: 60000, key: '1min' },
    { time: 120000, key: '2min' },
    { time: 180000, key: '3min' },
    { time: 240000, key: '4min' },
    { time: 300000, key: '5min' }
  ];

  const showNextMotivationalMessage = () => {
    if (!enableMotivationalMessages) return;

    const elapsedTime = Date.now() - startTime;
    
    // Find the appropriate message based on elapsed time
    const applicableInterval = messageIntervals.find(interval => elapsedTime >= interval.time);
    
    if (applicableInterval) {
      const message = motivationalMessages[applicableInterval.key as keyof typeof motivationalMessages];
      if (message) {
        // Occasionally add a motivational quote for variety
        const shouldShowQuote = Math.random() < 0.3; // 30% chance
        const quote = shouldShowQuote ? motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)] : undefined;
        
        // Update the toast with the motivational message
        toast(message.message, {
          description: quote || message.description,
          duration: 0,
          icon: '⏳'
        });
      }
    }

    // Schedule next message
    if (elapsedTime < 300000) { // Stop after 5 minutes
      motivationalTimer = setTimeout(showNextMotivationalMessage, motivationalInterval);
    }
  };

  // Function to show the final motivational message when API response ends
  const showFinalMessage = () => {
    if (!enableMotivationalMessages) return;
    
    const finalMessage = motivationalMessages['api-response'];
    if (finalMessage) {
      toast(finalMessage.message, {
        description: finalMessage.description,
        duration: 0,
        icon: '⏳'
      });
    }
  };

  // Start motivational messages
  if (enableMotivationalMessages) {
    motivationalTimer = setTimeout(showNextMotivationalMessage, motivationalInterval);
  }

  // Create the promise toast with custom messages
  toast.promise(
    promise,
    {
      loading: `${loadingMessage}\n\n⏳ This may take a few minutes...`,
      success: `${successMessage}\n\n✅ Your document is ready!`,
      error: `${errorMessage}\n\n❌ Please try again`,
    }
  );

  // Handle the promise separately for motivational messages
  return promise
    .then((result) => {
      // Show final motivational message before success
      showFinalMessage();
      
      // Small delay to show the final message
      return new Promise(resolve => setTimeout(resolve, 1000)).then(() => result);
    })
    .catch((error) => {
      // Re-throw the error to maintain the original promise behavior
      throw error;
    })
    .finally(() => {
      // Clean up motivational timer
      if (motivationalTimer) {
        clearTimeout(motivationalTimer);
      }
    });
}

export function createDocumentGenerationToast<T>(promise: Promise<T>): Promise<T> {
  return createPromiseToast(promise, {
    loadingMessage: 'Generating your legal document...',
    successMessage: 'Document generated successfully!',
    errorMessage: 'Document generation failed',
    enableMotivationalMessages: true,
    motivationalInterval: 10000 // Update every 10 seconds
  });
}