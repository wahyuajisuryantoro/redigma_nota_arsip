import { useState, useEffect } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import { saveAs } from 'file-saver'
import { Upload, Plus, Download, Loader2, Trash2, FileText, Calendar, Crop, X, Check, ImageIcon } from 'lucide-react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

function App() {
  const [dataArsip, setDataArsip] = useState([])
  const [keterangan, setKeterangan] = useState('')
  const [judulLaporan, setJudulLaporan] = useState('Laporan Arsip Nota & Jurnal')
  const [tglLaporan, setTglLaporan] = useState(new Date().toISOString().split('T')[0])
  const [previewTanggal, setPreviewTanggal] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)


  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState(null)
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    aspect: undefined
  })
  const [completedCrop, setCompletedCrop] = useState(null)
  const [imageRef, setImageRef] = useState(null)

  useEffect(() => {
    updatePreviewTanggal()
  }, [tglLaporan])

  const updatePreviewTanggal = () => {
    const tgl = new Date(tglLaporan)
    const formatted = tgl.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    setPreviewTanggal(formatted)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      processFile(file)
    }
  }

  const processFile = (file) => {
    if (!keterangan.trim()) {
      alert('Mohon isi keterangan terlebih dahulu!')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImageToCrop(event.target.result)
      setShowCropModal(true)
      setCrop({
        unit: '%',
        width: 90,
        aspect: undefined
      })
      setCompletedCrop(null)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    processFile(file)
    e.target.value = ''
  }

  const getCroppedImg = async () => {
    if (!completedCrop || !imageRef) {

      saveCroppedImage(imageToCrop)
      return
    }

    const canvas = document.createElement('canvas')
    const scaleX = imageRef.naturalWidth / imageRef.width
    const scaleY = imageRef.naturalHeight / imageRef.height

    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      imageRef,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    const croppedBase64 = canvas.toDataURL('image/png', 1.0)
    saveCroppedImage(croppedBase64)
  }

  const useWithoutCrop = () => {

    saveCroppedImage(imageToCrop)
  }

  const saveCroppedImage = (base64Image) => {
    const img = new Image()
    img.onload = () => {
      setDataArsip([...dataArsip, {
        keterangan: keterangan,
        foto: base64Image,
        w: img.naturalWidth,
        h: img.naturalHeight
      }])
      setKeterangan('')
      setShowCropModal(false)
      setImageToCrop(null)
      setCompletedCrop(null)
    }
    img.src = base64Image
  }

  const cancelCrop = () => {
    setShowCropModal(false)
    setImageToCrop(null)
    setCompletedCrop(null)
  }

  const tambahItem = () => {
    if (!keterangan.trim()) {
      alert('Mohon isi keterangan!')
      return
    }
    document.getElementById('inputFoto').click()
  }

  const hapusItem = (index) => {
    setDataArsip(dataArsip.filter((_, i) => i !== index))
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverItem = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropItem = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newData = [...dataArsip]
    const draggedItem = newData[draggedIndex]

    newData.splice(draggedIndex, 1)
    newData.splice(dropIndex, 0, draggedItem)

    setDataArsip(newData)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const downloadPDF = async () => {
    if (dataArsip.length === 0) {
      alert('Belum ada data untuk di-export!')
      return
    }

    setIsProcessing(true)

    try {
      const pdfDoc = await PDFDocument.create()
      const maxPerPage = 6
      let currentPage = null
      let pos = 0

      for (let i = 0; i < dataArsip.length; i++) {
        if (pos === 0) {
          currentPage = pdfDoc.addPage([595.28, 841.89])
          const { width, height } = currentPage.getSize()

          currentPage.drawText(judulLaporan.toUpperCase(), {
            x: 34,
            y: height - 51,
            size: 18,
            color: rgb(0, 0, 0),
          })

          currentPage.drawText('Departemen Finance & Accounting', {
            x: 34,
            y: height - 65,
            size: 9,
            color: rgb(0.4, 0.4, 0.4),
          })

          currentPage.drawText(`Tanggal: ${previewTanggal}`, {
            x: width - 180,
            y: height - 51,
            size: 9,
            color: rgb(0, 0, 0),
          })

          currentPage.drawLine({
            start: { x: 34, y: height - 74 },
            end: { x: width - 34, y: height - 74 },
            thickness: 2,
            color: rgb(0.12, 0.16, 0.23),
          })
        }

        const col = pos % 2
        const row = Math.floor(pos / 2)

        const colWidth = 270
        const rowHeight = 240
        const x = 34 + col * colWidth
        const y = 720 - row * rowHeight

        currentPage.drawText(`${i + 1}. ${dataArsip[i].keterangan.toUpperCase()}`, {
          x: x,
          y: y,
          size: 8,
          color: rgb(0.12, 0.29, 0.53),
        })

        const imgBytes = await fetch(dataArsip[i].foto).then(res => res.arrayBuffer())
        const embeddedImage = await pdfDoc.embedPng(imgBytes)
        const imgDims = embeddedImage.scale(1)

        const maxWidth = 250
        const maxHeight = 225

        let targetWidth = imgDims.width
        let targetHeight = imgDims.height

        if (targetWidth > maxWidth || targetHeight > maxHeight) {
          const widthRatio = maxWidth / targetWidth
          const heightRatio = maxHeight / targetHeight
          const scaleFactor = Math.min(widthRatio, heightRatio)

          targetWidth = targetWidth * scaleFactor
          targetHeight = targetHeight * scaleFactor
        }

        currentPage.drawImage(embeddedImage, {
          x: x,
          y: y - targetHeight - 6,
          width: targetWidth,
          height: targetHeight,
        })

        pos++
        if (pos >= maxPerPage && i < dataArsip.length - 1) {
          pos = 0
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      saveAs(blob, `${judulLaporan}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Terjadi kesalahan saat membuat PDF')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-slate-800 bg-clip-text text-transparent mb-2">
            Sistem Arsip Nota
          </h1>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl mb-8 border border-white/20">
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <label className="text-sm font-semibold text-slate-700 block mb-2 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                Keterangan Nota
              </label>
              <input
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-300 placeholder:text-slate-400"
                placeholder="Contoh: Nota Pembelian ATK Januari 2024"
              />
            </div>

            <div className="md:col-span-5">
              <label className="text-sm font-semibold text-slate-700 block mb-2 flex items-center gap-2">
                <Upload size={16} className="text-blue-600" />
                Upload Foto Nota
              </label>
              <input
                type="file"
                id="inputFoto"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('inputFoto').click()}
                className={`w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-50 rounded-2xl text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${dragOver
                    ? 'ring-2 ring-blue-400 bg-blue-100 scale-105'
                    : 'hover:shadow-lg hover:scale-105'
                  }`}
              >
                <Upload size={20} className={dragOver ? 'text-blue-600' : 'text-slate-500'} />
                <span className="text-slate-600 font-medium">
                  {dragOver ? 'Lepas file di sini' : 'Klik atau drag & drop'}
                </span>
              </div>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={tambahItem}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl py-3 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Tambah
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t border-slate-200">
            <input
              value={judulLaporan}
              onChange={(e) => setJudulLaporan(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-300"
              placeholder="Judul Laporan"
            />
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={tglLaporan}
                onChange={(e) => setTglLaporan(e.target.value)}
                className="pl-12 pr-4 py-3 bg-slate-50/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-300"
              />
            </div>
            <button
              onClick={downloadPDF}
              disabled={dataArsip.length === 0 || isProcessing}
              className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Generate PDF
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold uppercase text-slate-900 mb-1">
                {judulLaporan}
              </h2>
              <p className="text-sm text-slate-500">
                Departemen Finance & Accounting
              </p>
            </div>
            <div className="text-right text-sm bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3 rounded-xl">
              <p className="font-semibold text-slate-700">
                {previewTanggal}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                DIGITAL ARCHIVE SYSTEM
              </p>
            </div>
          </div>

          <div className="h-1 bg-gradient-to-r from-blue-600 via-slate-700 to-blue-600 rounded-full mb-8"></div>

          {dataArsip.length === 0 ? (
            <div className="text-center py-24 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl">
              <FileText size={64} className="mx-auto mb-4 text-slate-300" />
              <p className="text-xl font-bold text-slate-700 mb-2">Belum ada data arsip</p>
              <p className="text-sm text-slate-500">Mulai tambahkan nota untuk membuat laporan</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {dataArsip.map((item, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOverItem(e, index)}
                  onDrop={(e) => handleDropItem(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 shadow-md hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 transform hover:-translate-y-1 cursor-move ${draggedIndex === index
                      ? 'opacity-50 border-blue-500 scale-95'
                      : 'border-slate-200'
                    }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {item.keterangan}
                      </span>
                    </div>
                    <button
                      onClick={() => hapusItem(index)}
                      className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="bg-slate-100 rounded-xl overflow-hidden">
                    <img
                      src={item.foto}
                      alt={item.keterangan}
                      className="w-full h-56 object-contain pointer-events-none"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-slate-400 italic">Drag untuk memindah posisi</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          <p>💡 Crop gambar untuk hasil terbaik - Semua otomatis dikonversi ke PNG</p>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <Crop className="text-blue-600" size={24} />
                <h3 className="text-xl font-bold text-slate-900">Crop Gambar Nota</h3>
              </div>
              <button
                onClick={cancelCrop}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                >
                  <img
                    ref={(ref) => setImageRef(ref)}
                    src={imageToCrop}
                    alt="Crop preview"
                    className="max-w-full h-auto"
                    style={{ maxHeight: '60vh' }}
                  />
                </ReactCrop>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Crop size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Cara crop:</strong> Drag kotak untuk memilih area yang ingin dipotong.
                    Resize dari sudut untuk mengubah ukuran. Atau klik "Gunakan Tanpa Crop" untuk menggunakan gambar asli.
                  </span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelCrop}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Batal
                </button>
                <button
                  onClick={useWithoutCrop}
                  className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ImageIcon size={20} />
                  Gunakan Tanpa Crop
                </button>
                <button
                  onClick={getCroppedImg}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Crop & Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App