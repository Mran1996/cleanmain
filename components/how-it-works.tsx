export function HowItWorks() {
  return (
    <section className="bg-white py-12 sm:py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">How Ask AI Legal Works</h2>
          <p className="text-base sm:text-lg text-gray-600">Three Easy Steps to Legal Help</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 max-w-5xl mx-auto">
          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <span role="img" aria-label="Document" className="text-3xl sm:text-4xl">
                📄
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">1. Upload Your Document</h3>
            <p className="text-sm sm:text-base text-gray-600 px-2">
              Upload your motion, charge sheet, civil complaint, or court letter — anything legal.  
              We'll scan it and start building your strongest response.
            </p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <span role="img" aria-label="Brain" className="text-3xl sm:text-4xl">
                🧠
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">2. Ask AI Legal Reviews It</h3>
            <p className="text-sm sm:text-base text-gray-600 px-2">
              Our AI reads your document, breaks it down, and guides you like the best attorneys do —  
              but faster, clearer, and available 24/7.
            </p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <span role="img" aria-label="Pen" className="text-3xl sm:text-4xl">
                ✍️
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">3. Get Smart Legal Help</h3>
            <p className="text-sm sm:text-base text-gray-600 px-2">
              You'll receive a professional legal draft, formatted for court, backed by real case law,  
              and tailored to your facts — ready to file or mail.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
