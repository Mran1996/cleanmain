export function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-2">How Ask AI Legal Works</h2>
          <p className="text-lg text-gray-600">Three Easy Steps to Legal Help</p>
        </div>

        <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
          <div className="text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span role="img" aria-label="Document" className="text-4xl">
                📄
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3">1. Upload Your Document</h3>
            <p className="text-gray-600">
              Upload your motion, charge sheet, civil complaint, or court letter — anything legal.  
              We'll scan it and start building your strongest response.
            </p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span role="img" aria-label="Brain" className="text-4xl">
                🧠
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3">2. Ask AI Legal Reviews It</h3>
            <p className="text-gray-600">
              Our AI reads your document, breaks it down, and guides you like the best attorneys do —  
              but faster, clearer, and available 24/7.
            </p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span role="img" aria-label="Pen" className="text-4xl">
                ✍️
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3">3. Get Smart Legal Help</h3>
            <p className="text-gray-600">
              You'll receive a professional legal draft, formatted for court, backed by real case law,  
              and tailored to your facts — ready to file or mail.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
