export function SuccessStories() {
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Real People. Real Legal Wins.</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-1 px-2">Families and self-represented clients across the U.S. use Ask AI Legal to fight back — and win.</p>
        </div>
        <div className="bg-white py-2 text-center mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-medium italic text-muted-foreground px-4">
            We're not your attorney. We don't overcharge. We don't pass your case off to a paralegal. We're here to help you win—and bring your loved one home.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 max-w-5xl mx-auto">
          {/* Testimonial 1 */}
          <div className="flex-1 border-2 border-blue-300 rounded-2xl p-6 sm:p-8 bg-white flex flex-col items-center shadow-sm">
            <img
              src="https://randomuser.me/api/portraits/men/64.jpg"
              alt="Michael T., African American male, smiling in a suit"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 sm:mb-6 object-cover border-4 border-blue-100"
            />
            <p className="text-gray-900 text-sm sm:text-base md:text-lg text-center mb-4 sm:mb-6">
              "While on a jail call, my wife and I walked through the Ask AI Legal steps together.  <br className="hidden sm:block" />
              We used it to file a post-conviction motion — and for the first time, it feels like we actually have a shot. It gave us hope, fast."
            </p>
            <div className="text-center mt-auto">
              <div className="font-bold text-sm sm:text-base text-gray-800">MICHAEL T.</div>
              <div className="text-xs sm:text-sm text-gray-500">California</div>
            </div>
          </div>
          {/* Testimonial 2 */}
          <div className="flex-1 border-2 border-purple-300 rounded-2xl p-6 sm:p-8 bg-white flex flex-col items-center shadow-sm">
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="Sarah J. smiling with long hair"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 sm:mb-6 object-cover border-4 border-purple-100"
            />
            <p className="text-gray-900 text-sm sm:text-base md:text-lg text-center mb-4 sm:mb-6">
              "My brother needed to respond to a motion and we didn't know where to start.  <br className="hidden sm:block" />
              Ask AI Legal gave us a full draft with citations. It saved us thousands — and gave us control when everything felt stacked against us."
            </p>
            <div className="text-center mt-auto">
              <div className="font-bold text-sm sm:text-base text-gray-800">SARAH J.</div>
              <div className="text-xs sm:text-sm text-gray-500">Texas</div>
            </div>
          </div>
          {/* Testimonial 3 */}
          <div className="flex-1 border-2 border-green-300 rounded-2xl p-6 sm:p-8 bg-white flex flex-col items-center shadow-sm">
            <img
              src="https://randomuser.me/api/portraits/men/54.jpg"
              alt="Marcus L., Black male, friendly and approachable"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 sm:mb-6 object-cover border-4 border-green-100"
            />
            <p className="text-gray-900 text-sm sm:text-base md:text-lg text-center mb-4 sm:mb-6">
              "I told my sister what to upload and what to say. She used Ask AI Legal to file for early release.  <br className="hidden sm:block" />
              The motion actually went through — and I finally feel like something's moving forward."
            </p>
            <div className="text-center mt-auto">
              <div className="font-bold text-sm sm:text-base text-gray-800">MARCUS L.</div>
              <div className="text-xs sm:text-sm text-gray-500">Washington</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
