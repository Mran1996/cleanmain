export function HowItWorks() {
  return (
    <section className="bg-white py-8 sm:py-12 md:py-16 lg:py-20 w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-6 sm:mb-8 md:mb-12 lg:mb-16 w-full">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2">How Ask AI Legal Works</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">Three Easy Steps to Legal Help</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12 max-w-5xl mx-auto">
          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
              <span role="img" aria-label="Document" className="text-2xl sm:text-3xl md:text-4xl">
                📄
              </span>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">1. Upload Your Document</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">
              Upload your motion, charge sheet, civil complaint, or court letter — anything legal.  
              We'll scan it and start building your strongest response.
            </p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
              <span role="img" aria-label="Brain" className="text-2xl sm:text-3xl md:text-4xl">
                🧠
              </span>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">2. Ask AI Legal Reviews It</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">
              Our AI reads your document, breaks it down, and guides you like the best attorneys do —  
              but faster, clearer, and available 24/7.
            </p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
              <span role="img" aria-label="Pen" className="text-2xl sm:text-3xl md:text-4xl">
                ✍️
              </span>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">3. Get Smart Legal Help</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">
              You'll receive a professional legal draft, formatted for court, backed by real case law,  
              and tailored to your facts — ready to file or mail.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
