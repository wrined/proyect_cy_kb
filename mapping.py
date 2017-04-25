from elasticsearch import Elasticsearch
from datetime import datetime
import sys

es = Elasticsearch(['http://elastic:changeme@35.185.239.61:9200'])
# es = Elasticsearch(['http://52.26.229.35:9200'])


def __Eventviewer():
    """ antiguo group_2 """
    # doc = {'fecha':datetime.now(),
    #     'Level':'Level',
    #     'source':'source',
    #     'EventID':'EventID',
    #     'general':'data',
    #     'atm_id':'atm'
    # }
    # es.index(index="event_viewer", doc_type='events',  body=doc)
    # return
#    es.indices.delete(index="event_viewer")
    doc = {
        "mappings": {
            "events": {
                "properties": {
                    "fecha":     {"type": "date"},
                    # "general":     {"type": "string"},
                    # "Level":     {"type": "string"},
                    # "source":     {"type": "string"},
                    # "EventID":     {"type": "integer"},
                },
                "_source": {
                    "enabled": True
                }
            }
        }
    }
    es.indices.create(index="event_viewer", body=doc)


def __XFSlogs():
    """ antiguo group_1 """
#    es.indices.delete(index="xfs_logs")
    doc = {
        "mappings": {
            "events": {
                "properties": {
                    "retiro":     {"type": "long"},
                    "fecha":     {"type": "date"},
#                    "informacion":     {"type": "string"},
                    "consulta":     {"type": "integer"},
                    "tipo":     {"type": "integer"},
 #                   "otro":     {"type": "string"},

                },
                "_source": {
                    "enabled": True
                }
            }
        }
    }
    es.indices.create(index="xfs_logs", body=doc)


def __Errores():
    """ antiguo group_3 """
#    es.indices.delete(index="errores")
    doc = {
        "mappings": {
            "events": {
                "properties": {
                    "fecha":     {"type": "date"},
    #                "Onsite":     {"type": "string"},
   #                 "journal":     {"type": "string"},
  #                  "description":     {"type": "string"},
 #                   "NetworkAction":     {"type": "string"},
                },
                "_source": {
                    "enabled": True
                }
            }
        }
    }
    es.indices.create(index="errores", body=doc)


def __faltantes():
    """ antiguo group_4 """
 #   es.indices.delete(index="faltantes")
    doc = {
        "mappings": {
            "events": {
                "properties": {
                    "monto":     {"type": "long"},
                    "date_start":     {"type": "date"},
                    "date_end":     {"type": "date"},
                },
                "_source": {
                    "enabled": True
                }}}}

    es.indices.create(index="faltantes", body=doc)
    data = {
        'caso':'caso test',
        'monto':0,
        'date_start':datetime.now(),
        'date_end':datetime.now(),
        'divisa':'$',
        'banco':'',
        'cantidad':5,
        # 'atms':request.POST['atms'],
        'address':'',
        'hardware':'',
        'software':'',
        'so':'',
        'cajas':4,
        # 'atmid':a['atmid'],
        'atm_id':''
        }

    es.index(index="faltantes", doc_type='events',  body=data)


def __AMI():
    """ antiguo group_5 """
    #es.indices.delete(index="ami")
    doc = {
        "mappings": {
            "events": {
                "properties": {
                    "time":     {"type": "date"},
#                    "pid_tid":     {"type": "string"},
#                    "item":     {"type": "string"},
#                    "level":     {"type": "string"},
#                    "information":     {"type": "string"},
                },
                "_source": {
                    "enabled": True
                }}}}
    es.indices.create(index="ami", body=doc)


def __AgilisUDB():
    """ antiguo group_6 """
   # es.indices.delete(index="agilis_udb")
    doc1 = {
        "mappings": {
            "events": {
                "properties": {
                    "fecha":     {"type": "date"},
     #               "Descripcion_evento":     {"type": "string"}

                },
                "_source": {
                    "enabled": True
                }

            }
        }
    }

    es.indices.create(index="agilis_udb", body=doc1)


def __cajasEfectivo():
    """ antiguo group_6 """
    #es.indices.delete(index="atm_cajas")
    doc1 = {
        "mappings": {
            "events": {
                "properties": {
                    "date_start":     {"type": "date"},
                    "fecha":     {"type": "date"},
                    "actual":     {"type": "long"},
                    "agregado":     {"type": "long"},
#                    "cajas": {"properties":{"actual":{"type":"long"},"agregado":{"type":"long"}}}
                    "100":{"type":"integer"},
                    "500":{"type":"integer"},
                    "1000":{"type":"integer"}

                },
                "_source": {
                    "enabled": True
                }

            }
        }
    }

    es.indices.create(index="atm_cajas", body=doc1)

def __mapa():
    #es.indices.delete(index="mapa")
    doc = {
       "mappings": {
          "atm": {
            "properties": {
               "fecha":{"type":"date"},
               "location": {
                     "type": "geo_point"
                     }
                  }
               },
            "xfs":{
                  "_parent":{"type":"atm"},
                  "properties": {
                    "retiro":     {"type": "long"},
                    "fecha":     {"type": "date"},
#                    "informacion":     {"type": "string"},
                    "consulta":     {"type": "integer"},
                    "tipo":     {"type": "integer"},
 #                   "otro":     {"type": "string"},
#                    "_parent":{"type":"atm"}

                },
                "_source": {
                    "enabled": True
                }		
		}
             }
          }
    es.indices.create(index="mapa", body=doc)
    data = {
         "text": "Geo-point as an object",
         "fecha": datetime.now(),
         "location":'19.8489441,-71.650996516'# { 
                 #  "lat": '19.8489441',
                #   "lon": '-71.6509965,16z'
               #    }
           }
#    es.index(index="mapa", doc_type='saint_sunday',  body=data)

def __smart():
    #es.indices.delete(index="smart_vist")
    doc = {
       "mappings": {
          "events": {
            "properties": {
               "fecha":{"type":"date"}
                  }
               }
             }
          }
    es.indices.create(index="smart_vist", body=doc)



def __skimming():
#    es.indices.delete(index="skimming")
    doc = {
       "mappings": {
          "events": {
            "properties": {
               "fecha":{"type":"date"},
               "status":{"type":"integer"}
                  }
               }
             }
          }
    es.indices.create(index="skimming", body=doc)


def __vpro():
#    es.indices.delete(index="mapa")
    doc = {
       "mappings": {
          "atm": {
            "properties": {
               "fecha_insercion":{"type":"date"},
               "fecha_programada":{"type":"date"},
               "location": {"type": "geo_point"},
               #"end_point":{"type":"string"},
               "banco":{"type":"integer"},
               #"grupo":{"type":"string"},
	       #"estado":{"type":"string"},
               #"temperatura":{"type":"string"},
               "velocidad":{"type":"integer"},
               #"CPU":{"type":"string"},
               "IDUUID":{"type":"integer"},
               "version_vpro":{"type":"integer"},
               #"so":{"type":"string"},
               #"software_xfs":{"type":"string"},
               "cantidad_usb":{"type":"integer"},
               #"reglas":{"type":"string"},
                  }
               }
             }
         }          
    es.indices.create(index="vpro", body=doc)
    doc = {
       "fecha_insercion":datetime.now(),
       "fecha_programada":datetime.now(),
       "location": "19.8489441,-71.650996516",
       "end_point":"string1",
       "banco":1,
       "grupo":"string",
       "estado":"string",
       "temperatura":"string",
       "velocidad":4,
       "CPU":"string",
       "IDUUID":1,
       "version_vpro":1,
       "so":"string",
       "software_xfs":"string",
       "cantidad_usb":2,
       "reglas":"string2",
          }
    es.index(index="vpro", doc_type='atm',id=5,  body=doc)


def main():
    #__XFSlogs()
    #__Eventviewer()
    #__Errores()
    #__faltantes()
    #__AMI()
    #__AgilisUDB()
    #__cajasEfectivo() 
    #__mapa()
    #__smart()
    #__vpro()
    __skimming()
if __name__ == "__main__":
    sys.exit(main())

"""
doc3 = {
  "mappings": {
    "events": {
      "properties": {
		"fecha":     { "type": "date" },
		"Onsite":     { "type": "string" },
		"journal":     { "type": "string" },
		"description":     { "type": "string" },
		"NetworkAction":     { "type": "string" },

      },
      "_source": {
        "enabled": True
      }

    }
  }
}

doc2 = {
  "mappings": {
    "events": {
      "properties": {
		"fecha":     { "type": "date" },
		"general":     { "type": "string" },
		"Level":     { "type": "string" },
		"source":     { "type": "string" },
		"EventID":     { "type": "integer" },

      },
      "_source": {
        "enabled": True
      }

    }
  }
}

doc1 = {
  "mappings": {
    "events": {
      "properties":{
        "retiro":{ "type": "long" },
		"fecha": { "type": "date" },
		"informacion":{ "type": "string" },
		"consulta": { "type": "integer" },
		"tipo":{"type": "integer" },
        "otro":{"type": "string" },
		"atm_id":{"type": "string" },
		"tarjeta":{ "type": "string" },
		"error":{ "type": "string" },

      },
      "_source": {
        "enabled": True
      }

    }
  }
}



doc4 = {
  "mappings": {
    "events": {
      "properties": {
        "monto":     { "type": "long" },
        "date_start":     { "type": "date" },
        "date_end":     { "type": "date" },

      },
      "_source": {
        "enabled": True
      }

    }
  }
}

doc5 = {
  "mappings": {
    "events": {
      "properties": {
        "time":     { "type": "date" },
        "pid_tid":     { "type": "string" },
        "item":     { "type": "string" },
        "level":     { "type": "string" },
        "information":     { "type": "string" },
      },
      "_source": {
        "enabled": True
      }

    }
  }
}

N50976 > 87800
N51064 > 805350
N51065 > 1084200
N51013 > 1210450
N30280 > 488000
N20819 > 582000
NM0648 > 180000
N20707 > 360750
N21184 > 748600





"""
